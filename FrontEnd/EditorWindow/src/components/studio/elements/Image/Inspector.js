import { baseStyles, typographyStyles, flexStyles } from "@/builder/utils/inspectorConfigs";

export default {
  ...baseStyles,
  
  "media": [
    {
      "key": "src",
      "label": "Image URL",
      "type": "asset_picker",
      "target": "props"
    },
    {
      "key": "alt",
      "label": "Alt Text",
      "type": "text",
      "target": "props"
    }
  ]

};
