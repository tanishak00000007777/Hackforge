import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export default function DeviceSwitcher() {
  const device = useEditorStore((state) => state.device);
  const setDevice = useEditorStore((state) => state.setDevice);

  const devices = [
    {
      id: "desktop",
      icon: Monitor,
    },
    {
      id: "tablet",
      icon: Tablet,
    },
    {
      id: "mobile",
      icon: Smartphone,
    },
  ];

  return (
    <div className="flex items-center justify-center">

      <div
        className="
          inline-flex
          items-center
          gap-0.5
          rounded-xl
          border
          border-slate-200
          bg-white
          p-1
        "
      >
        {devices.map(({ id, icon: Icon }) => {
          const active = device === id;

          return (
            <button
              key={id}
              onClick={() => setDevice(id)}
              className={`
                flex
                items-center
                justify-center
                h-8
                w-8
                rounded-lg
                transition-all
                duration-200

                ${
                  active
                    ? "bg-violet-100 text-violet-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-100"
                }
              `}
            >
              <Icon size={16} strokeWidth={2} />
            </button>
          );
        })}
      </div>

    </div>
  );
}
