import { baseStyles, typographyStyles, flexStyles } from "@/builder/utils/inspectorConfigs";

export default {
  ...baseStyles,
  
  "settings": [
    {
      "key": "placeholder",
      "label": "Placeholder",
      "type": "text",
      "target": "props"
    },
    {
      "key": "rows",
      "label": "Rows",
      "type": "number",
      "target": "props"
    }
  ],
  "typography": [
    ...typographyStyles
  ]

};
