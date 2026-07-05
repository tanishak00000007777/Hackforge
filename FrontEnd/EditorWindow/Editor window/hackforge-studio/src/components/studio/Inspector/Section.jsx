export default function Section({

title,

children,

}){

return(

<section
className="
space-y-6
pb-8
border-b
border-slate-200
"
>

<h3
className="
text-xs
uppercase
tracking-[0.25em]
font-bold
text-slate-500
"
>

{title}

</h3>

{children}

</section>

);

}