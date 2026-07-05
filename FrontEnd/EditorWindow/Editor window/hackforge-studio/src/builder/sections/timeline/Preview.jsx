import ElementRenderer from "@/components/studio/elements/ElementRenderer";

export default function TimelinePreview(props) {
  return (
    <div data-node-id={props.id} 
      className="transition-all duration-300"
      style={{ ...props.styles,
        background: props.background ?? "#FFFFFF",
        paddingTop: `${props.paddingTop ?? 96}px`,
        paddingBottom: `${props.paddingBottom ?? 96}px`,
      }}
    >
      <ElementRenderer children={props.children} sectionId={props.id} />
    </div>
  );
}

