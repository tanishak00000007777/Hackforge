import { baseStyles, typographyStyles, flexStyles } from "@/builder/utils/inspectorConfigs";

export default {
  ...baseStyles,
  
  "typography": [
    {
      "key": "text",
      "label": "Text",
      "type": "text",
      "target": "props"
    },
    ...typographyStyles
  ]

};
