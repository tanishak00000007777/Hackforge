const fs = require('fs');
const path = require('path');

const elements = [
  'Heading', 'Paragraph', 'Button', 'Image', 
  'Container', 'Row', 'Column', 'Grid', 'Divider', 
  'Badge', 'Card', 'Video', 'Countdown', 'Accordion', 
  'Tabs', 'Input', 'Textarea', 'Map'
];

const elementsDir = path.join(__dirname, 'src', 'components', 'studio', 'elements');

if (!fs.existsSync(elementsDir)) {
  fs.mkdirSync(elementsDir, { recursive: true });
}

elements.forEach((el) => {
  const elDir = path.join(elementsDir, el);
  if (!fs.existsSync(elDir)) {
    fs.mkdirSync(elDir, { recursive: true });
  }

  const type = el.toLowerCase();

  const componentContent = `import React from "react";
import EditableText from "@/components/studio/common/EditableText";
import ElementRenderer from "../ElementRenderer";

export default function ${el}({ id, type, props, styles, responsive, children, locked, hidden }) {
  if (hidden) return null;
  return (
    <div className="element-wrapper" style={{ ...styles }}>
      <div className="p-4 border border-dashed border-gray-300">
        ${el} Element
        {children && children.length > 0 && (
          <ElementRenderer children={children} />
        )}
      </div>
    </div>
  );
}
`;

  const defaultContent = `export default {
  type: "${type}",
  props: {},
  styles: {},
  responsive: { desktop: {}, tablet: {}, mobile: {} },
  children: [],
  locked: false,
  hidden: false,
};
`;

  const schemaContent = `export default {
  type: "${type}",
  displayName: "${el}",
  icon: "Box", // Default icon
};
`;

  const inspectorContent = `export default {
  properties: [
    // Add specific properties here
  ],
  styles: [
    // Standard styles
  ]
};
`;

  const indexContent = `import Component from "./${el}";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const ${type}Element = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
`;

  fs.writeFileSync(path.join(elDir, `${el}.jsx`), componentContent);
  fs.writeFileSync(path.join(elDir, 'Default.js'), defaultContent);
  fs.writeFileSync(path.join(elDir, 'Schema.js'), schemaContent);
  fs.writeFileSync(path.join(elDir, 'Inspector.js'), inspectorContent);
  fs.writeFileSync(path.join(elDir, 'index.js'), indexContent);
});

console.log("Scaffolded all 18 elements successfully.");
