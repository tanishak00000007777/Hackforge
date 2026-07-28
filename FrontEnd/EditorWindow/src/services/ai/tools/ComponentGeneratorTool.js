import { editorAdapter } from "../EditorAdapter";
import * as coreFactory from "@/builder/factories/coreFactory";
import { catalogueMetadata } from "@/builder/registry/catalogue";

export const ComponentGeneratorTool = {
  name: "generate_component",
  description: "Creates and inserts a new component or section into the canvas.",
  parameters: {
    type: "object",
    properties: {
      componentType: {
        type: "string",
        description: "The type of component to generate (e.g. 'hero', 'pricing', 'button', 'image')"
      },
      props: {
        type: "object",
        description: "Optional props to initialize the component with (e.g. { text: 'Click Me' })"
      }
    },
    required: ["componentType"]
  },
  execute: async (args, context) => {
    const { componentType, props } = args;
    const lowerType = componentType.toLowerCase();

    // Find closest match in catalogue
    let bestMatch = null;
    let maxScore = 0;
    for (const [key, meta] of Object.entries(catalogueMetadata)) {
      if (key === lowerType) {
        bestMatch = key;
        break; // exact match
      }
      if (meta.tags && meta.tags.includes(lowerType)) {
        if (3 > maxScore) {
          maxScore = 3;
          bestMatch = key;
        }
      }
      if (key.includes(lowerType)) {
        if (2 > maxScore) {
          maxScore = 2;
          bestMatch = key;
        }
      }
    }

    if (!bestMatch) {
      return { success: false, error: `Could not find a component matching '${componentType}'.` };
    }

    const meta = catalogueMetadata[bestMatch];
    const node = meta?.category === "Sections" 
      ? coreFactory.createComponent(bestMatch)
      : coreFactory.createElement(bestMatch);

    if (!node) {
      return { success: false, error: "Factory failed to create component." };
    }

    // Apply any AI-provided props
    if (props) {
      node.props = { ...node.props, ...props };
    }

    // If it's a floating element, give it absolute positioning so it doesn't break
    if (meta?.category !== "Sections") {
      node.styles = { ...node.styles, position: "absolute", left: "200px", top: "200px", zIndex: "10" };
    }

    editorAdapter.addComponent(node);
    
    return { success: true, message: `Successfully generated and added a new ${bestMatch}.` };
  }
};
