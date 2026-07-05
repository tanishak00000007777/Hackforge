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
    {
      "key": "tag",
      "label": "HTML Tag",
      "type": "select",
      "options": [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6"
      ],
      "target": "props"
    },
    ...typographyStyles
  ]

};
