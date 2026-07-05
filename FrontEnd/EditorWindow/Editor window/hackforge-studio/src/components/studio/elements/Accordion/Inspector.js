import { baseStyles, typographyStyles, flexStyles } from "@/builder/utils/inspectorConfigs";

export default {
  ...baseStyles,
  
  "settings": [
    {
      "key": "title",
      "label": "Title",
      "type": "text",
      "target": "props"
    },
    {
      "key": "headerBackground",
      "label": "Header Bg",
      "type": "color",
      "target": "props"
    }
  ],
  "typography": [
    ...typographyStyles
  ]

};
