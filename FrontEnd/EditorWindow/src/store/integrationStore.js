import { create } from "zustand";
import { createProjectSnapshot, useEditorStore } from "@/store/editorStore";
import { getManagedHackathon, publishHackathon, saveWebsiteConfig } from "@/services/hackforgeApi";

let initializationPromise = null;
let initializationKey = "";
let savePromise = null;
let saveAgain = false;
let publishRequested = false;

// The host app owns authentication; it hands us a callback so it can refresh
// the token and re-render. (This used to postMessage the parent frame.)
function notifyExpiredSession(session) {
  session?.onSessionExpired?.();
}

export const useIntegrationStore = create((set, get) => ({
  session: null,
  hackathon: null,
  loadStatus: "connecting",
  saveStatus: "idle",
  error: null,
  lastSavedAt: null,

  initialize: async (session) => {
    const key = `${session.hackathonId}:${session.accessToken}`;
    if (initializationPromise && initializationKey === key) return initializationPromise;

    initializationKey = key;
    set({ session, loadStatus: "loading", error: null });
    initializationPromise = getManagedHackathon(session)
      .then((hackathon) => {
        if (hackathon.website_config?.currentPageId) {
          useEditorStore.getState().hydrateProject(hackathon.website_config);
        } else {
          useEditorStore.getState().resetProject();
        }
        set({ hackathon, loadStatus: "ready", saveStatus: "saved", error: null });
        return hackathon;
      })
      .catch((error) => {
        if (error.status === 401) notifyExpiredSession(session);
        set({ loadStatus: "error", error: error.message });
        throw error;
      })
      .finally(() => {
        initializationPromise = null;
      });
    return initializationPromise;
  },

  saveWebsite: async ({ publish = false } = {}) => {
    if (publish) publishRequested = true;
    if (savePromise) {
      saveAgain = true;
      return savePromise;
    }

    const run = async () => {
      do {
        saveAgain = false;
        const shouldPublish = publishRequested;
        publishRequested = false;
        const session = get().session;
        if (!session) throw new Error("Studio session is not connected");

        set({ saveStatus: shouldPublish ? "publishing" : "saving", error: null });
        let hackathon = await saveWebsiteConfig(
          session,
          createProjectSnapshot(useEditorStore.getState()),
        );
        if (shouldPublish) hackathon = await publishHackathon(session);
        set({
          hackathon,
          saveStatus: shouldPublish ? "published" : "saved",
          lastSavedAt: new Date().toISOString(),
        });
      } while (saveAgain || publishRequested);
    };

    savePromise = run()
      .catch((error) => {
        if (error.status === 401) notifyExpiredSession(get().session);
        set({ saveStatus: "error", error: error.message });
        throw error;
      })
      .finally(() => {
        savePromise = null;
      });
    return savePromise;
  },
}));
