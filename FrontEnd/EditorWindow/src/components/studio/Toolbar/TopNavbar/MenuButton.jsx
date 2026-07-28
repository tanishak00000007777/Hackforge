import { useEffect, useRef, useState } from "react";

/**
 * Small dropdown used by the toolbar menus. One implementation so every menu
 * dismisses, positions and keyboard-handles identically -- three separate
 * popovers is exactly the kind of clutter this redesign removes.
 */
export default function MenuButton({ label, icon: Icon, title, align = "right", variant = "ghost", children }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapper = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event) => {
      if (!wrapper.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event) => event.key === "Escape" && setIsOpen(false);

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const base = "flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors";
  const styles = {
    ghost: isOpen
      ? "bg-[#F1EEF9] text-[#2B0A5A]"
      : "text-[#5E5B6B] hover:bg-[#F4F2FA] hover:text-[#130225]",
    outline: isOpen
      ? "border border-[#D8DAE5] bg-[#F1EEF9] text-[#2B0A5A]"
      : "border border-[#E7E8F4] bg-white text-[#383547] hover:bg-[#F8F8FC]",
  }[variant];

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        title={title || label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`${base} ${styles}`}
      >
        {Icon && <Icon size={15} strokeWidth={1.8} />}
        {label && <span className="hidden md:inline">{label}</span>}
      </button>

      {isOpen && (
        <div
          role="menu"
          onClick={() => setIsOpen(false)}
          className={`absolute top-11 z-50 min-w-[210px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-[#E7E8F4] bg-white p-1.5 shadow-[0_8px_28px_rgba(19,2,37,0.10)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** A row inside a MenuButton. */
export function MenuItem({ icon: Icon, label, hint, onClick, active = false }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
        active ? "bg-[#F1EEF9] text-[#2B0A5A]" : "text-[#383547] hover:bg-[#F6F5FB]"
      }`}
    >
      {Icon && <Icon size={15} strokeWidth={1.8} className={active ? "text-[#2B0A5A]" : "text-[#8A8697]"} />}
      <span className="flex-1 font-medium">{label}</span>
      {hint && <span className="text-[11px] text-[#A5A1B2]">{hint}</span>}
    </button>
  );
}

export const MenuDivider = () => <div className="my-1 h-px bg-[#EFEDF6]" />;
