export default function NumberInput({

label,

value,

onChange,

min,

max,
placeholder,

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

<input

type="number"

value={value}

min={min}

max={max}
placeholder={placeholder}

onChange={(e) => {
  let val = Number(e.target.value);
  if (min !== undefined && val < min) val = min;
  if (max !== undefined && val > max) val = max;
  onChange(val);
}}

className="
w-full
rounded-xl
border
border-slate-300
bg-white
px-3
py-2.5
outline-none
focus:border-violet-600
focus:ring-2
focus:ring-violet-100
"

/>

</div>

);

}
