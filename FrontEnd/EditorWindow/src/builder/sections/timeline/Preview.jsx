import ElementRenderer from "@/components/studio/elements/ElementRenderer";
import { sectionStyle } from "../sectionStyle";

export default function TimelinePreview(props) {
  return (
    <div data-node-id={props.id} 
      className="transition-all duration-300"
      style={sectionStyle(props, { background: "#FFFFFF", paddingTop: 96, paddingBottom: 96 })}
    >
      <ElementRenderer children={props.children} sectionId={props.id} />
    </div>
  );
}

