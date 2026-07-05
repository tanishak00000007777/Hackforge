import { useEditorStore } from "@/store/editorStore";

import Section from "../Section";
import SliderInput from "../controls/SliderInput";

export default function SpacingPanel() {

  const selectedId = useEditorStore(
    (state) => state.selectedId
  );

  const selected = useEditorStore((state)=>
    state.components.find(
      c=>c.id===selectedId
    )
  );

  const updateComponent = useEditorStore(
    state=>state.updateComponent
  );

  if(!selected) return null;

  const p = selected.props;

  return(

    <Section title="Spacing">

      <SliderInput
        label="Top Padding"
        value={p.paddingTop ?? 96}
        min={0}
        max={240}
        onChange={(value)=>
          updateComponent(selected.id,{
            paddingTop:value,
          })
        }
      />

      <SliderInput
        label="Bottom Padding"
        value={p.paddingBottom ?? 96}
        min={0}
        max={240}
        onChange={(value)=>
          updateComponent(selected.id,{
            paddingBottom:value,
          })
        }
      />

    </Section>

  );

}