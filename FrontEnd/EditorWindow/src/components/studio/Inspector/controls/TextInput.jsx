import { useState } from "react";
import { Sparkles } from "lucide-react";
import { improveText } from "@/services/AIService";

export default function TextInput({
    label,
    value,
    onChange,
    placeholder=""
}){
    const [isImproving, setIsImproving] = useState(false);

    const handleImprove = async () => {
        if (!value || isImproving) return;
        setIsImproving(true);
        try {
            const newText = await improveText(value);
            onChange(newText);
        } catch (e) {
            console.error(e);
        } finally {
            setIsImproving(false);
        }
    };

return(

<div className="space-y-2">

<div className="flex items-center justify-between">
<label
className="
text-xs
font-semibold
text-slate-500
"
>
{label}
</label>
<button 
    onClick={handleImprove}
    disabled={isImproving || !value}
    className="text-[10px] text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 disabled:opacity-50"
    title="Improve text with AI"
>
    <Sparkles size={12} className={isImproving ? "animate-pulse" : ""} />
    {isImproving ? "Improving..." : "AI"}
</button>
</div>

<input

value={value || ""}

placeholder={placeholder}

onChange={(e)=>onChange(e.target.value)}

className="
w-full
rounded-xl
border
border-slate-300
bg-white
px-3
py-2.5
outline-none
transition
focus:border-violet-600
focus:ring-2
focus:ring-violet-100
"

/>

</div>

);

}
