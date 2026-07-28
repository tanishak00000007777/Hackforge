import { defineTool, ok, fail, resolveTarget } from "./defineTool";
import { useEditorStore } from "@/store/editorStore";
import { editorAdapter } from "../EditorAdapter";

const ASSET_TYPES = ["image", "video", "icon", "pdf"];
const store = () => useEditorStore.getState();

const isUsableUrl = (url) =>
  typeof url === "string" && /^(https?:\/\/|\/|data:image\/)/.test(url.trim());

export const uploadAsset = defineTool({
  name: "uploadAsset",
  description: "Registers an asset URL in the project's asset library so it can be reused.",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "Absolute URL, root-relative path, or data: URI." },
      name: { type: "string", description: "Display name for the library." },
      type: { type: "string", enum: ASSET_TYPES, description: `Asset kind: ${ASSET_TYPES.join(", ")}.` },
    },
    required: ["url"],
  },
  execute: ({ url, name, type = "image" }) => {
    if (!isUsableUrl(url)) {
      return fail("url must be an http(s) URL, a root-relative path, or a data:image URI. blob: URLs do not survive a reload.");
    }
    if (!ASSET_TYPES.includes(type)) return fail(`Unknown asset type '${type}'. Expected: ${ASSET_TYPES.join(", ")}.`);

    const asset = {
      id: crypto.randomUUID(),
      name: name || url.split("/").pop() || "asset",
      type,
      url: url.trim(),
    };
    store().addAsset(asset);
    return ok({ asset, librarySize: store().assets.length });
  },
});

export const deleteAsset = defineTool({
  name: "deleteAsset",
  description: "Removes an asset from the library and reports which components still reference it.",
  parameters: {
    type: "object",
    properties: { assetId: { type: "string", description: "Id of the asset to remove." } },
    required: ["assetId"],
  },
  execute: ({ assetId }, context) => {
    const asset = store().assets.find((a) => a.id === assetId);
    if (!asset) return fail(`No asset found with id '${assetId}'.`);

    const stillUsing = [];
    const walk = (nodes) => {
      for (const node of nodes || []) {
        if (node.props?.src === asset.url) stillUsing.push(node.id);
        walk(node.children);
      }
    };
    walk(context.getState().components);

    store().removeAsset(assetId);
    return ok({ deleted: { id: asset.id, name: asset.name }, stillReferencedBy: stillUsing });
  },
});

export const replaceImage = defineTool({
  name: "replaceImage",
  description: "Points an image component at a different source, optionally updating its alt text.",
  parameters: {
    type: "object",
    properties: {
      componentId: { type: "string", description: "Image component. Defaults to the current selection." },
      url: { type: "string", description: "New image URL. Either this or assetId is required." },
      assetId: { type: "string", description: "Id of an asset in the library to use instead of a raw URL." },
      alt: { type: "string", description: "Alt text describing the image." },
    },
  },
  execute: ({ componentId, url, assetId, alt }, context) => {
    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);
    if (node.type !== "image") return fail(`Component '${node.id}' is a '${node.type}', not an image.`);

    let source = url;
    if (assetId) {
      const asset = store().assets.find((a) => a.id === assetId);
      if (!asset) return fail(`No asset found with id '${assetId}'.`);
      source = asset.url;
    }
    if (!source) return fail("Provide either url or assetId.");
    if (!isUsableUrl(source)) return fail("The image source must be an http(s) URL, a root-relative path, or a data:image URI.");

    const props = { src: source };
    if (alt !== undefined) props.alt = alt;

    editorAdapter.updateNode(node.id, { props });
    return ok({ componentId: node.id, src: source, alt: alt ?? node.props?.alt ?? null });
  },
});

export const replaceIcon = defineTool({
  name: "replaceIcon",
  description: "Changes the icon on a component that renders one, by icon name.",
  parameters: {
    type: "object",
    properties: {
      componentId: { type: "string", description: "Component carrying the icon. Defaults to the current selection." },
      icon: { type: "string", description: "Icon name, e.g. 'arrow-right'." },
    },
    required: ["icon"],
  },
  execute: ({ componentId, icon }, context) => {
    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);
    if (!String(icon).trim()) return fail("icon cannot be empty.");

    const iconKey = ["icon", "iconName", "leftIcon"].find((key) => key in (node.props || {})) || "icon";
    const previous = node.props?.[iconKey] ?? null;

    editorAdapter.updateNode(node.id, { props: { [iconKey]: icon } });
    return ok({ componentId: node.id, prop: iconKey, previous, icon });
  },
});

export const assetTools = [uploadAsset, deleteAsset, replaceImage, replaceIcon];
