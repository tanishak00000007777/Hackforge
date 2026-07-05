import { Sparkles } from "lucide-react";

export default function UpgradeCard() {
  return (
    <div
      className="
        mt-auto
        bg-primary-container
        p-4
        rounded-2xl
        text-on-primary
      "
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles
          size={18}
          className="text-secondary-container"
        />

        <span
          className="
            font-headline-md
            text-body-md
            font-bold
          "
        >
          AI Assistant
        </span>
      </div>

      <p
        className="
          text-on-primary-container
          font-label-sm
          text-label-sm
          leading-relaxed
          mb-4
        "
      >
        Generate copy and layout blocks instantly with AI.
      </p>

      <button
        className="
          w-full
          py-2
          bg-secondary
          text-on-secondary
          rounded-lg
          font-bold
          text-label-sm
          hover:bg-secondary/90
          transition-all
        "
      >
        Upgrade Pro
      </button>
    </div>
  );
}