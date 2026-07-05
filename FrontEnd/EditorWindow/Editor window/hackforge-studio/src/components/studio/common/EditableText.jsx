import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Pencil } from "lucide-react";

export default function EditableText({
  componentId,
  sectionId,
  property,
  value,
  onChange,
  className = "",
  style = {},
  as: Component = "div",
  placeholder = "Enter text...",
  "data-node-id": dataNodeId,
}) {
  const [editing, setEditing] = useState(false);
  const [hovered,setHovered]=useState(false);
  const [text, setText] = useState(value ?? "");

  const inputRef = useRef(null);
  const updateComponent = useEditorStore((state) => state.updateComponent);
  const updateElement = useEditorStore((state) => state.updateElement);

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function save() {
    setEditing(false);

    if (text === value) return;

    if (componentId && property) {
      if (sectionId) {
        updateElement(sectionId, componentId, { [property]: text });
      } else {
        updateComponent(componentId, { [property]: text });
      }
    }

    onChange?.(text);
  }

  function cancel() {
    setText(value ?? "");
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    }

    if (e.key === "Escape") {
      cancel();
    }
  }

  if (editing) {
    return (
        <input
      ref={inputRef}
      value={text}
      className={`
          ${className}
          rounded
          outline-none
          ring-2
          ring-violet-500
          px-2
          py-1
          bg-white
        `}
        style={style}
        onChange={(e)=>setText(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
    />
    );
  }

  return (
  <div
    className={`relative inline-block ${className}`}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    data-node-id={dataNodeId}
    style={style}
  >
    <Component
      className={`
        transition-all
        duration-150
        rounded
        hover:ring-2
        hover:ring-violet-400
        hover:ring-offset-2
        hover:bg-violet-50/40
      `}
      style={{
        cursor: "text",
        userSelect: "none",
      }}
      onDoubleClick={() => setEditing(true)}
    >
      {value || placeholder}
    </Component>

    {hovered && !editing && (
      <div
        className="
          absolute
          -right-6
          top-1/2
          -translate-y-1/2
          text-violet-500
          pointer-events-none
        "
      >
        <Pencil size={14} />
      </div>
    )}
  </div>
);
  
}