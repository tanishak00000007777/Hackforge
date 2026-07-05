export default function SelectInput({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <div className="space-y-2">

      <label className="text-xs font-semibold text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="
          w-full
          rounded-xl
          border
          border-slate-300
          px-3
          py-2.5
          outline-none
          bg-white
          focus:border-violet-600
        "
      >
        {options.map((option)=>(
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>

    </div>
  );
}