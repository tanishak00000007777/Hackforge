export default function FormEmbedPreview(props) {
  return (
    <section
      data-node-id={props.id}
      style={{
        ...props.styles,
        background: props.background || "#F5F0F7",
        paddingTop: `${props.paddingTop ?? 32}px`,
        paddingBottom: `${props.paddingBottom ?? 32}px`,
      }}
    >
      <iframe
        src={props.formUrl}
        title="HackForge form"
        style={{ display: "block", width: "min(100%, 900px)", height: `${props.height ?? 720}px`, margin: "0 auto", border: 0, borderRadius: 16, background: "white" }}
      />
    </section>
  );
}
