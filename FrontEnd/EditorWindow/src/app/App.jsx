import { useEffect, useMemo, useState } from "react";
import StudioLayout from "@/layouts/StudioLayout";
import { useIntegrationStore } from "@/store/integrationStore";

const SESSION_KEY = "hackforge_studio_session";

function readStoredSession(hackathonId) {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return session?.hackathonId === hackathonId ? session : null;
  } catch {
    return null;
  }
}

function getConfiguredParentOrigin(hackathonId) {
  const configuredOrigin = import.meta.env.VITE_APP_ORIGIN;
  if (configuredOrigin) return new URL(configuredOrigin).origin;
  const storedOrigin = readStoredSession(hackathonId)?.parentOrigin;
  if (storedOrigin) return storedOrigin;
  if (document.referrer) return new URL(document.referrer).origin;
  return null;
}

export default function App() {
  const hackathonId = useMemo(
    () => new URLSearchParams(window.location.search).get("hackathonId"),
    [],
  );
  const initialize = useIntegrationStore((state) => state.initialize);
  const loadStatus = useIntegrationStore((state) => state.loadStatus);
  const error = useIntegrationStore((state) => state.error);
  const [session, setSession] = useState(() => readStoredSession(hackathonId));
  const parentOrigin = useMemo(() => getConfiguredParentOrigin(hackathonId), [hackathonId]);

  useEffect(() => {
    if (!hackathonId) return undefined;

    const receiveSession = (event) => {
      if (event.source !== window.parent || event.origin !== parentOrigin) return;
      if (event.data?.type !== "hackforge:studio:init") return;
      if (event.data.version !== 1 || event.data.hackathonId !== hackathonId || !event.data.accessToken) return;

      const nextSession = {
        hackathonId,
        accessToken: event.data.accessToken,
        apiBaseUrl: import.meta.env.DEV ? "/api/v1" : event.data.apiBaseUrl,
        returnUrl: event.data.returnUrl,
        user: event.data.user,
        parentOrigin: event.origin,
      };
      sessionStorage.setItem("hackforge_studio_event_id", hackathonId);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    };

    window.addEventListener("message", receiveSession);
    if (window.parent !== window && parentOrigin) {
      window.parent.postMessage({
        type: "hackforge:studio:ready",
        hackathonId,
      }, parentOrigin);
    }
    return () => window.removeEventListener("message", receiveSession);
  }, [hackathonId, parentOrigin]);

  useEffect(() => {
    if (!session) return;
    sessionStorage.setItem("hackforge_studio_event_id", session.hackathonId);
    initialize(session).catch(() => {});
  }, [initialize, session]);

  if (!hackathonId) {
    return <ConnectionScreen title="No hackathon selected" message="Open Website Studio from your organizer dashboard." />;
  }
  if (!parentOrigin && !session) {
    return <ConnectionScreen title="Studio is not connected" message="Open this editor from your HackForge organizer dashboard." />;
  }
  if (!session || loadStatus === "connecting" || loadStatus === "loading") {
    return <ConnectionScreen title="Connecting to HackForge" message="Loading your event website..." loading />;
  }
  if (loadStatus === "error") {
    return <ConnectionScreen title="Unable to open this website" message={error || "Check your access and try again."} />;
  }
  return <StudioLayout />;
}

function ConnectionScreen({ title, message, loading = false }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F6FB] p-6 text-[#130225]">
      <div className="w-full max-w-md rounded-2xl border border-[#E7E2EE] bg-white p-8 text-center shadow-xl shadow-[#130225]/5">
        {loading && <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-2 border-[#DED7E8] border-t-[#2B0A5A]" />}
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[#6B6574]">{message}</p>
      </div>
    </main>
  );
}
