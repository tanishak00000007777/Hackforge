import { componentRegistry } from "@/builder/registry";
import { Plus } from "lucide-react";
import * as coreFactory from "@/builder/factories/coreFactory";
import { useEditorStore } from "@/store/editorStore";

export default function SectionManager() {
  const addComponent = useEditorStore(
    (state) => state.addComponent
  );

  function addSection(type) {
    const section = coreFactory.createComponent(type);
    if (section) {
      addComponent(section);
    }
  }

  const sections = Object.values(componentRegistry);

  return (
    <div className="relative">
      <details className="group">
        <summary
          className="
            flex
            items-center
            gap-2
            cursor-pointer
            rounded-lg
            bg-[#2B0A5A]
            text-white
            px-3
            py-2
            font-semibold
            select-none
            whitespace-nowrap
          "
        >
          <Plus size={17}/>
          <span className="hidden xl:inline">Add Section</span>
        </summary>
        <div
          className="
            absolute
            top-14
            left-0
            w-60
            rounded-2xl
            bg-white
            shadow-xl
            border
            p-2
            z-50
          "
        >
          {sections.map((section) => (
            <button
              key={section.type}
              onClick={() => addSection(section.type)}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                hover:bg-slate-100
                text-left
              "
            >
              <span className="font-medium text-slate-700">{section.displayName}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
