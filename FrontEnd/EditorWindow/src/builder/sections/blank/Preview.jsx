import ElementRenderer from "@/components/studio/elements/ElementRenderer";
import { sectionStyle } from "../sectionStyle";

export default function BlankPreview(props) {
  const isEmpty = !props.children?.[0]?.children?.length;

  return (
    <div
      data-node-id={props.id}
      className="transition-all duration-300"
      style={sectionStyle(props, { background: "#FFFFFF", paddingTop: 96, paddingBottom: 96 })}
    >
      <ElementRenderer children={props.children} sectionId={props.id} />

      {isEmpty && (
        <div className="mx-6 rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
          Empty section — drop elements here, or ask the AI to fill it.
        </div>
      )}
    </div>
  );
}
