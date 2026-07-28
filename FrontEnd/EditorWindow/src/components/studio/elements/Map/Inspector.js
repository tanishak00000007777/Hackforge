import { baseStyles, typographyStyles, flexStyles } from "@/builder/utils/inspectorConfigs";

export default {
  ...baseStyles,
  
  "settings": [
    {
      "key": "address",
      "label": "Address",
      "type": "text",
      "target": "props"
    },
    {
      "key": "zoom",
      "label": "Zoom Level",
      "type": "number",
      "target": "props"
    }
  ]

};
