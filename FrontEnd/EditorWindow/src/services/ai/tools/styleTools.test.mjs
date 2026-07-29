import assert from "node:assert/strict";
import { sectionStyle } from "@/builder/sections/sectionStyle";
import { useEditorStore } from "@/store/editorStore";
import { contextEngine } from "../ContextEngine";
import { updateColors } from "./styleTools";

const sectionId = "tracks-section";
useEditorStore.setState({
  components: [{
    id: sectionId,
    type: "tracks",
    props: { background: "#F8FAFC" },
    styles: {},
    children: [],
  }],
  selectedIds: [sectionId],
  history: [],
  future: [],
});

const result = await updateColors.execute({ backgroundColor: "#0C4A6E" }, contextEngine);
assert.equal(result.success, true);
assert.equal(result.data.componentId, sectionId);

const selected = useEditorStore.getState().components[0];
assert.equal(selected.styles.backgroundColor, "#0C4A6E");
assert.equal(
  sectionStyle({ ...selected.props, styles: selected.styles }).backgroundColor,
  "#0C4A6E",
  "the AI colour edit must render on the selected section",
);

console.log("styleTools selection: all checks passed");
