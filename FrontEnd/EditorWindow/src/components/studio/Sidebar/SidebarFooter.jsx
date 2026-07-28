export default function SidebarFooter() {
  return (
    <div className="mt-auto border-t border-slate-200 px-6 py-6">
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white">
        <h3 className="mb-2 font-semibold">
          AI Assistant
        </h3>

        <p className="text-sm text-violet-100">
          Generate copy and layout blocks instantly with AI.
        </p>

        <button
          className="
            mt-5
            w-full
            rounded-xl
            bg-white
            py-2.5
            font-semibold
            text-violet-700
            transition
            hover:bg-violet-50
          "
        >
          Upgrade Pro
        </button>
      </div>
    </div>
  );
}