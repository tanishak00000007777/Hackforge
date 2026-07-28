import ElementRenderer from "@/components/studio/elements/ElementRenderer";
import { sectionStyle } from "../sectionStyle";

export default function HeroPreview(props) {
  return (
    <div data-node-id={props.id} 
        className="relative min-h-[920px] flex flex-col items-center justify-center px-12 transition-all duration-300"
        style={sectionStyle(props, { background: "#FFFFFF", paddingTop: 112, paddingBottom: 112 })}
    >
      <ElementRenderer children={props.children} sectionId={props.id} />
    </div>
  );
}
