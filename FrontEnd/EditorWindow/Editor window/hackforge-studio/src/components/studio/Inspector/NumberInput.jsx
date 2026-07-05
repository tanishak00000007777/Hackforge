export default function NumberInput({

label,

value,

onChange,

}){

return(

<div className="space-y-2">

<label className="text-xs font-medium">

{label}

</label>

<input

type="number"

value={value}

onChange={e=>onChange(Number(e.target.value))}

className="w-full rounded-xl border border-slate-300 px-3 py-2"

/>

</div>

);

}