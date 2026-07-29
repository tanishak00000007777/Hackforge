import { useEffect } from "react";
import StudioLayout from "@/layouts/StudioLayout";
import { useIntegrationStore } from "@/store/integrationStore";

/* The studio used to run as its own origin on port 4175 and receive its
 * session over postMessage from the parent frame. It now mounts directly
 * inside the HackForge organizer app, so the host passes the session in as a
 * prop and the whole bridge is gone.
 *
 * `.studio-root` carries the studio's reset, design tokens and sizing. Every
 * studio style is scoped under it, which is what stops the editor restyling
 * the organizer shell it now shares a document with. */
export default function App({ session }) {
  return (
    <div className="studio-root">
      <StudioApp session={session} />
    </div>
  );
}

function StudioApp({ session }) {
  const initialize = useIntegrationStore((state) => state.initialize);
  const loadStatus = useIntegrationStore((state) => state.loadStatus);
  const error = useIntegrationStore((state) => state.error);

  useEffect(() => {
    if (!session?.hackathonId || !session.accessToken) return;
    // editorStore namespaces its persisted draft by this key.
    sessionStorage.setItem("hackforge_studio_event_id", session.hackathonId);
    initialize(session).catch(() => {});
  }, [initialize, session]);

  if (!session?.hackathonId) {
    return <ConnectionScreen title="No hackathon selected" message="Open Website Studio from your organizer dashboard." />;
  }
  if (!session.accessToken) {
    return <ConnectionScreen title="Your session has expired" message="Sign in again to keep editing this website." />;
  }
  if (loadStatus === "connecting" || loadStatus === "loading") {
    return <ConnectionScreen title="Opening Website Studio" message="Loading your event website..." loading />;
  }
  if (loadStatus === "error") {
    return <ConnectionScreen title="Unable to open this website" message={error || "Check your access and try again."} />;
  }
  return <StudioLayout />;
}

function ConnectionScreen({ title, message, loading = false }) {
  return (
    <main className="flex h-full items-center justify-center bg-[#F8F6FB] p-6 text-[#130225]">
      <div className="w-full max-w-md rounded-2xl border border-[#E7E2EE] bg-white p-8 text-center shadow-xl shadow-[#130225]/5">
        {loading && <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-2 border-[#DED7E8] border-t-[#2B0A5A]" />}
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[#6B6574]">{message}</p>
      </div>
    </main>
  );
}
