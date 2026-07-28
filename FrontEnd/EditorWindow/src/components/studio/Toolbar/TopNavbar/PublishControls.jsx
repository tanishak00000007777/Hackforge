import { useState } from "react";
import PublishModal from "@/components/studio/Publish/PublishModal";

/**
 * The single primary action in the toolbar. Import, export and templates moved
 * into the project menu -- one emphasised button reads as a clear next step,
 * four competing ones read as noise.
 */
export default function PublishControls() {
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPublishModalOpen(true)}
        className="flex h-9 items-center rounded-lg bg-[#130225] px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2B0A5A]"
      >
        Publish
      </button>

      <PublishModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} />
    </>
  );
}
