/**
 * Generic horizontal toolbar.
 */

export default function ToolbarGroup({

children,

}){

return(

<div
className="

flex
items-center
gap-2

rounded-2xl

bg-white/70

backdrop-blur-xl

border

border-white/60

shadow-sm

px-2

py-1

"
>

{children}

</div>

);

}