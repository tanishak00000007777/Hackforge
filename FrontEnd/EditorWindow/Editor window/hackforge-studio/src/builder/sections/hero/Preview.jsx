import ElementRenderer from "@/components/studio/elements/ElementRenderer";

export default function HeroPreview(props) {
  return (
    <div data-node-id={props.id} 
        className="relative min-h-[920px] flex flex-col items-center justify-center px-12 transition-all duration-300"
        style={{ ...props.styles,
          background: props.background ?? "#FFFFFF",
          paddingTop: `${props.paddingTop ?? 112}px`,
          paddingBottom: `${props.paddingBottom ?? 112}px`,
        }}
    >
      <ElementRenderer children={props.children} sectionId={props.id} />
    </div>
  );
}
