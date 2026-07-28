const fs = require('fs');
const path = require('path');
const elementsDir = 'c:\\\\Users\\\\asus\\\\Desktop\\\\HackForge\\\\EditorWindow\\\\Editor window\\\\hackforge-studio\\\\src\\\\components\\\\studio\\\\elements';

const elementMap = {
  Heading: {
    typography: [
      { key: 'text', label: 'Text', type: 'text', target: 'props' },
      { key: 'tag', label: 'HTML Tag', type: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], target: 'props' },
      '__TYPOGRAPHY__'
    ]
  },
  Paragraph: {
    typography: [
      { key: 'text', label: 'Text', type: 'text', target: 'props' },
      '__TYPOGRAPHY__'
    ]
  },
  Button: {
    typography: [
      { key: 'text', label: 'Text', type: 'text', target: 'props' },
      '__TYPOGRAPHY__'
    ]
  },
  Badge: {
    typography: [
      { key: 'text', label: 'Text', type: 'text', target: 'props' },
      '__TYPOGRAPHY__'
    ]
  },
  Image: {
    media: [
      { key: 'src', label: 'Image URL', type: 'text', target: 'props' },
      { key: 'alt', label: 'Alt Text', type: 'text', target: 'props' }
    ]
  },
  Video: {
    media: [
      { key: 'src', label: 'Video URL', type: 'text', target: 'props' },
      { key: 'autoPlay', label: 'Auto Play (true/false)', type: 'select', options: ['false', 'true'], target: 'props' },
      { key: 'controls', label: 'Controls (true/false)', type: 'select', options: ['true', 'false'], target: 'props' }
    ]
  },
  Input: {
    settings: [
      { key: 'placeholder', label: 'Placeholder', type: 'text', target: 'props' },
      { key: 'type', label: 'Type', type: 'select', options: ['text', 'email', 'password', 'number'], target: 'props' }
    ],
    typography: ['__TYPOGRAPHY__']
  },
  Textarea: {
    settings: [
      { key: 'placeholder', label: 'Placeholder', type: 'text', target: 'props' },
      { key: 'rows', label: 'Rows', type: 'number', target: 'props' }
    ],
    typography: ['__TYPOGRAPHY__']
  },
  Map: {
    settings: [
      { key: 'address', label: 'Address', type: 'text', target: 'props' },
      { key: 'zoom', label: 'Zoom Level', type: 'number', target: 'props' }
    ]
  },
  Countdown: {
    settings: [
      { key: 'date', label: 'Target Date', type: 'text', target: 'props' }
    ],
    typography: ['__TYPOGRAPHY__']
  },
  Row: {
    flex: ['__FLEX__']
  },
  Column: {
    flex: ['__FLEX__']
  },
  Grid: {
    grid: [
      { key: 'gridTemplateColumns', label: 'Columns', type: 'text', target: 'styles' },
      { key: 'gap', label: 'Gap', type: 'text', target: 'styles' }
    ]
  },
  Accordion: {
    settings: [
      { key: 'title', label: 'Title', type: 'text', target: 'props' },
      { key: 'headerBackground', label: 'Header Bg', type: 'color', target: 'props' }
    ],
    typography: ['__TYPOGRAPHY__']
  }
};

const defaultElements = ['Container', 'Card', 'Tabs', 'Divider'];
defaultElements.forEach(el => { elementMap[el] = {}; });

Object.keys(elementMap).forEach(el => {
  const file = path.join(elementsDir, el, 'Inspector.js');
  let configStr = JSON.stringify(elementMap[el], null, 2);
  configStr = configStr.replace(/"__TYPOGRAPHY__"/g, '...typographyStyles');
  configStr = configStr.replace(/"__FLEX__"/g, '...flexStyles');

  const content = `import { baseStyles, typographyStyles, flexStyles } from "@/builder/utils/inspectorConfigs";\n\nexport default {\n  ...baseStyles,\n  ${configStr.slice(1, -1)}\n};\n`;

  fs.writeFileSync(file, content);
  console.log('Fixed ' + el);
});
