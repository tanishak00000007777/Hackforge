import { Sparkles } from "lucide-react";

export default function PremiumCard() {
  return (
    <div className="rounded-xl bg-[#2B0A5A] p-5 text-white shadow-xl shadow-[#2B0A5A]/20">

      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18}/>
        <h4 className="font-semibold">
          AI Design Assistant
        </h4>
      </div>

      <p className="text-sm opacity-80">
        Improve layouts, typography and spacing with one click.
      </p>

      <button className="mt-5 w-full rounded-lg bg-white text-[#2B0A5A] py-2 font-semibold shadow-sm hover:bg-slate-50 transition-colors">
        Try Premium
      </button>

    </div>
  );
}