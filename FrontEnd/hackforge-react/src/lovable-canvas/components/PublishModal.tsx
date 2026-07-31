import React, { useEffect, useState } from 'react';
import { X, Globe, Sparkles, CheckCircle2, Copy, ExternalLink, Rocket, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
  initialSlug?: string;
  onPublish?: (slug: string) => Promise<string>;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, itemCount, initialSlug = 'my-hackathon', onPublish }) => {
  const [slug, setSlug] = useState(initialSlug);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setSlug(initialSlug);
    else {
      setDeployedUrl(null);
      setError(null);
    }
  }, [initialSlug, isOpen]);

  if (!isOpen) return null;

  const celebrate = () => {
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // The publish itself succeeded; animation support is optional.
    }
  };

  const handlePublish = async () => {
    setIsDeploying(true);
    setError(null);
    try {
      const url = onPublish
        ? await onPublish(slug)
        : `https://${slug.toLowerCase().replace(/[^a-z0-9-]/g, '')}.hackforge.app`;
      setDeployedUrl(url);
      celebrate();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Publishing failed. Please try again.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyLink = () => {
    if (deployedUrl) {
      navigator.clipboard.writeText(deployedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div id="publish-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        {/* Header */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Publish Canvas Web App</h2>
              <p className="text-xs text-slate-500">Deploy instant shareable link with global edge CDN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {!deployedUrl ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Subdomain Name
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 rounded-xl px-3 py-2.5 text-xs text-slate-800 transition-colors">
                  <Globe className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-awesome-app"
                    className="bg-transparent text-slate-800 focus:outline-none w-full font-mono font-medium"
                  />
                  <span className="text-slate-400 font-mono text-[11px] shrink-0">.hackforge.app</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Canvas Elements</span>
                  <span className="font-bold text-indigo-600">{itemCount} components</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Grid Collision System</span>
                  <span className="font-bold text-emerald-600">Zero Overlaps (16px spacing)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">CDN Edge Hosting</span>
                  <span className="font-bold text-indigo-600">Cloud Run Global Fast SSL</span>
                </div>
              </div>

              <button
                id="confirm-publish-btn"
                onClick={handlePublish}
                disabled={isDeploying || !slug.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compiling & Deploying to Edge...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Publish App Live</span>
                  </>
                )}
              </button>
              {error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-6 h-6 animate-bounce" />
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-800">Application Published!</h3>
                <p className="text-xs text-slate-500 mt-1">Your canvas application is live on the edge.</p>
              </div>

              <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs font-mono text-emerald-800">
                <span className="truncate mr-2 font-semibold">{deployedUrl}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
                    title="Copy Link"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={deployedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
                    title="Open Live URL"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-200"
              >
                Done / Return to Canvas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
