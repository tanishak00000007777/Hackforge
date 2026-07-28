import { Plus } from "lucide-react";
import { componentRegistry } from "@/builder/registry";
import { catalogueMetadata } from "@/builder/registry/catalogue";
import * as coreFactory from "@/builder/factories/coreFactory";
import { useEditorStore } from "@/store/editorStore";
import MenuButton, { MenuItem, MenuDivider } from "../Toolbar/TopNavbar/MenuButton";

export default function SectionManager({ trigger = { icon: Plus, label: "Add" } }) {
  const addComponent = useEditorStore((state) => state.addComponent);

  const addSection = (type) => {
    const section = coreFactory.createComponent(type);
    if (section) addComponent(section);
  };

  const sections = Object.values(componentRegistry);
  // A blank section is the neutral starting point; the rest are pre-built.
  const blank = sections.find((section) => section.type === "blank");
  const prebuilt = sections.filter((section) => section.type !== "blank");

  return (
    <MenuButton icon={trigger.icon} label={trigger.label} title="Add a section">
      {blank && (
        <>
          <MenuItem label={blank.displayName} hint="empty" onClick={() => addSection(blank.type)} />
          <MenuDivider />
        </>
      )}
      {prebuilt.map((section) => (
        <MenuItem
          key={section.type}
          label={section.displayName}
          hint={catalogueMetadata[section.type]?.tags?.[0]}
          onClick={() => addSection(section.type)}
        />
      ))}
    </MenuButton>
  );
}
