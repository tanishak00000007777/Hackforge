import { useIntegrationStore } from "@/store/integrationStore";

export default function UserProfile() {
  const user = useIntegrationStore((state) => state.session?.user);
  const initials = (user?.full_name || user?.email || "HackForge")
    .split(/[\s@]+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      type="button"
      title={user?.email || "HackForge account"}
      aria-label="Account"
      className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#2B0A5A] text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
    >
      {initials}
    </button>
  );
}
