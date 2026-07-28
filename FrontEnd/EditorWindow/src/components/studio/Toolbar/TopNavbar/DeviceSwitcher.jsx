import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

const DEVICES = [
  { id: "desktop", icon: Monitor, label: "Desktop" },
  { id: "tablet", icon: Tablet, label: "Tablet" },
  { id: "mobile", icon: Smartphone, label: "Mobile" },
];

export default function DeviceSwitcher() {
  const device = useEditorStore((state) => state.device);
  const setDevice = useEditorStore((state) => state.setDevice);

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-[#F4F2FA] p-0.5" role="group" aria-label="Viewport">
      {DEVICES.map(({ id, icon: Icon, label }) => {
        const active = device === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setDevice(id)}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={`flex h-8 w-8 items-center justify-center rounded-[7px] transition-all
              ${active ? "bg-white text-[#2B0A5A] shadow-sm" : "text-[#8A8697] hover:text-[#5E5B6B]"}`}
          >
            <Icon size={15} strokeWidth={1.8} />
          </button>
        );
      })}
    </div>
  );
}
