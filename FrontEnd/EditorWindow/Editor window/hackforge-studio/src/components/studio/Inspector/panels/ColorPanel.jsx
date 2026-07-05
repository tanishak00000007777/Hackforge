import { useEditorStore } from "@/store/editorStore";

import Section from "../Section";
import ColorInput from "../controls/ColorInput";

export default function ColorPanel() {

  const selectedId = useEditorStore(
    (state) => state.selectedId
  );

  const selected = useEditorStore((state) =>
    state.components.find(
      (c) => c.id === selectedId
    )
  );

  const updateComponent = useEditorStore(
    (state) => state.updateComponent
  );

  if (!selected) return null;

  const p = selected.props;

  return (

    <Section title="Colors">

      <ColorInput
        label="Heading Color"
        value={p.color ?? "#171C5A"}
        onChange={(value)=>
          updateComponent(selected.id,{
            color:value,
          })
        }
      />

      <ColorInput
        label="Subtitle Color"
        value={p.subtitleColor ?? "#64748B"}
        onChange={(value)=>
          updateComponent(selected.id,{
            subtitleColor:value,
          })
        }
      />

      <ColorInput
        label="Button Color"
        value={p.buttonColor ?? "#2B0A5A"}
        onChange={(value)=>
          updateComponent(selected.id,{
            buttonColor:value,
          })
        }
      />

    </Section>

  );

}