export default function ColorInput({
    label,
    value,
    onChange,

}){

return(
<div className="space-y-2">

    <label
        className="
        text-xs
        font-semibold
        text-slate-500
        "
        >
        {label}
    </label>
 <div className="flex gap-3">
    <input
        type="color"
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="
        h-11
        w-11
        rounded-lg
        cursor-pointer
        "

    />

    <input
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="
        flex-1
        rounded-xl
        border
        border-slate-300
        px-3
        outline-none
        focus:border-violet-600
        "
    />
</div>
</div>

);

}