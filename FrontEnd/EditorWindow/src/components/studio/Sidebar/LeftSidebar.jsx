import SidebarHeader from "./SidebarHeader";
import SidebarSearch from "./SidebarSearch";
import SidebarTabs from "./SidebarTabs";
import ComponentLibrary from "./ComponentLibrary";
import AssetLibrary from "./AssetLibrary";
import SidebarFooter from "./SidebarFooter";
import LayersPanel from "./Layers/LayersPanel";
import HistoryPanel from "./History/HistoryPanel";
import { useEditorStore } from "@/store/editorStore";

export default function LeftSidebar() {
  const sidebarTab = useEditorStore((state) => state.sidebarTab);

  return (
    <aside
      className="
      w-[300px]
      min-w-[300px]
      shrink-0
      bg-[#FCFBFE]
      border-r
      border-[#E7E8F4]
      flex
      flex-col
      overflow-y-auto
      overflow-x-hidden
      py-5
      "
    >
      <SidebarHeader />

      <SidebarTabs />

      {/* Search only filters the block catalogue; on Layers, Media and Versions
          it was a box that did nothing. */}
      {(sidebarTab === "Sections" || sidebarTab === "Elements") && <SidebarSearch />}

      {sidebarTab === "Layers" ? (
        <LayersPanel />
      ) : sidebarTab === "History" ? (
        <HistoryPanel />
      ) : sidebarTab === "Assets" ? (
        <AssetLibrary />
      ) : (
        <ComponentLibrary />
      )}

      <SidebarFooter />
    </aside>
  );
}