import ElementRenderer from "@/components/studio/elements/ElementRenderer";
import { sectionStyle } from "../sectionStyle";

export default function FooterPreview(props) {
  return (
    <div data-node-id={props.id} 
      className="transition-all duration-300"
      style={sectionStyle(props, { background: "#0F172A", paddingTop: 64, paddingBottom: 64 })}
    >
      <ElementRenderer children={props.children} sectionId={props.id} />
    </div>
  );
}

