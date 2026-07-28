import { baseStyles, typographyStyles, flexStyles } from "@/builder/utils/inspectorConfigs";

export default {
  ...baseStyles,
  
  "media": [
    {
      "key": "src",
      "label": "Video URL",
      "type": "text",
      "target": "props"
    },
    {
      "key": "autoPlay",
      "label": "Auto Play (true/false)",
      "type": "select",
      "options": [
        "false",
        "true"
      ],
      "target": "props"
    },
    {
      "key": "controls",
      "label": "Controls (true/false)",
      "type": "select",
      "options": [
        "true",
        "false"
      ],
      "target": "props"
    }
  ]

};
