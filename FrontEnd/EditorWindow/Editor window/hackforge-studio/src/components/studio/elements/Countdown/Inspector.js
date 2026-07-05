import { baseStyles, typographyStyles, flexStyles } from "@/builder/utils/inspectorConfigs";

export default {
  ...baseStyles,
  
  "settings": [
    {
      "key": "date",
      "label": "Target Date",
      "type": "text",
      "target": "props"
    }
  ],
  "typography": [
    ...typographyStyles
  ]

};
