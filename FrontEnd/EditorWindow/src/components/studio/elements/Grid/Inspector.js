import { baseStyles, typographyStyles, flexStyles } from "@/builder/utils/inspectorConfigs";

export default {
  ...baseStyles,
  
  "grid": [
    {
      "key": "gridTemplateColumns",
      "label": "Columns",
      "type": "text",
      "target": "styles"
    },
    {
      "key": "gap",
      "label": "Gap",
      "type": "text",
      "target": "styles"
    }
  ]

};
