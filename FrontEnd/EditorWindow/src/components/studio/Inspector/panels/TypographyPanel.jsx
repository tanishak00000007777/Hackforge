import { useEditorStore } from "@/store/editorStore";

import Section from "../Section";
import TextInput from "../controls/TextInput";
import NumberInput from "../controls/NumberInput";

export default function TypographyPanel() {

  const selectedId = useEditorStore(
    (state) => state.selectedId
  );

  const selected = useEditorStore((state) =>
    state.components.find(
      (component) => component.id === selectedId
    )
  );

  const updateComponent = useEditorStore(
    (state) => state.updateComponent
  );

  if (!selected) return null;

  const p = selected.props;

  return (

    <Section title="Typography">

      {/* ---------------- Badge ---------------- */}

      <TextInput
        label="Badge Text"
        value={p.badge ?? ""}
        onChange={(value) =>
          updateComponent(selected.id, {
            badge: value,
          })
        }
      />

      <NumberInput
        label="Badge Size"
        value={p.badgeSize ?? 24}
        onChange={(value) =>
          updateComponent(selected.id, {
            badgeSize: value,
          })
        }
      />

      {/* ---------------- Heading ---------------- */}

      <TextInput
        label="Heading"
        value={p.title ?? ""}
        onChange={(value) =>
          updateComponent(selected.id, {
            title: value,
          })
        }
      />

      <NumberInput
        label="Heading Size"
        value={p.fontSize ?? 72}
        onChange={(value) =>
          updateComponent(selected.id, {
            fontSize: value,
          })
        }
      />

      <NumberInput
        label="Heading Weight"
        value={p.fontWeight ?? 900}
        onChange={(value) =>
          updateComponent(selected.id, {
            fontWeight: value,
          })
        }
      />

      <NumberInput
        label="Line Height"
        value={p.lineHeight ?? 78}
        onChange={(value) =>
          updateComponent(selected.id, {
            lineHeight: value,
          })
        }
      />

      <NumberInput
        label="Letter Spacing"
        value={p.letterSpacing ?? -2}
        onChange={(value) =>
          updateComponent(selected.id, {
            letterSpacing: value,
          })
        }
      />

      {/* ---------------- Subtitle ---------------- */}

      <TextInput
        label="Subtitle"
        value={p.subtitle ?? ""}
        onChange={(value) =>
          updateComponent(selected.id, {
            subtitle: value,
          })
        }
      />

      <NumberInput
        label="Subtitle Size"
        value={p.subtitleSize ?? 28}
        onChange={(value) =>
          updateComponent(selected.id, {
            subtitleSize: value,
          })
        }
      />

      {/* ---------------- Buttons ---------------- */}

      <TextInput
        label="Primary Button"
        value={p.primaryButton ?? ""}
        onChange={(value) =>
          updateComponent(selected.id, {
            primaryButton: value,
          })
        }
      />

      <TextInput
        label="Secondary Button"
        value={p.secondaryButton ?? ""}
        onChange={(value) =>
          updateComponent(selected.id, {
            secondaryButton: value,
          })
        }
      />

      <NumberInput
        label="Button Font Size"
        value={p.buttonFontSize ?? 20}
        onChange={(value) =>
          updateComponent(selected.id, {
            buttonFontSize: value,
          })
        }
      />

    </Section>

  );

}