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
      "key": "type",
      "label": "Type",
      "type": "select",
      "options": [
        "text",
        "email",
        "password",
        "number"
      ],
      "target": "props"
    }
  ],
  "typography": [
    ...typographyStyles
  ]

};
