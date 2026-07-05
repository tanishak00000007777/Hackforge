export default function SliderInput({

label,

value,

onChange,

min=0,

max=100,

}){

return(

<div className="space-y-2">

<div className="flex justify-between">

<label
className="
text-xs
font-semibold
text-slate-500
"
>

{label}

</label>

<div
className="
text-xs
font-medium
"
>

{value}px

</div>

</div>

<input

type="range"

min={min}

max={max}

value={value}

onChange={(e)=>onChange(Number(e.target.value))}

className="
w-full
accent-violet-600
"

/>

</div>

);

}