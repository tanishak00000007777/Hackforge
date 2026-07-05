import ElementRenderer from "@/components/studio/elements/ElementRenderer";

export default function FooterPreview(props) {
  return (
    <div data-node-id={props.id} 
      className="transition-all duration-300"
      style={{ ...props.styles,
        background: props.background ?? "#0F172A",
        paddingTop: `${props.paddingTop ?? 64}px`,
        paddingBottom: `${props.paddingBottom ?? 64}px`,
      }}
    >
      <ElementRenderer children={props.children} sectionId={props.id} />
    </div>
  );
}

