import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { conversationManager } from "@/services/ai/ConversationManager";
import { runFullAudit } from "@/services/ai/tools/analysisTools";
import { Sparkles, MessageSquare, ShieldCheck, Search, AlertCircle, X, Send, Check, Loader2 } from "lucide-react";

const SEVERITY_RANK = { low: 0, medium: 1, high: 2 };

/** Named phases, in the order the pipeline emits them. */
const STAGES = [
  { id: "reading", label: "Reading your page" },
  { id: "thinking", label: "Working out the changes" },
  { id: "applying", label: "Applying to the page" },
];

/**
 * A model call can run for fifteen seconds. Three anonymous bouncing dots for
 * that long reads as a frozen editor, so each phase is named and ticked off as
 * it completes.
 */
function GenerationProgress({ progress }) {
  const activeIndex = STAGES.findIndex((stage) => stage.id === progress?.stage);

  return (
    <div className="rounded-2xl rounded-tl-sm border border-[#E7E8F4] bg-white px-4 py-3 shadow-sm">
      <ul className="space-y-2">
        {STAGES.map((stage, index) => {
          const isDone = activeIndex > index;
          const isActive = activeIndex === index;
          const counter =
            isActive && stage.id === "applying" && progress.total
              ? ` ${Math.min(progress.done + 1, progress.total)} of ${progress.total}`
              : "";

          return (
            <li
              key={stage.id}
              className={`flex items-center gap-2 text-[12.5px] transition-colors
                ${isDone ? "text-slate-400" : isActive ? "font-medium text-[#2B0A5A]" : "text-slate-300"}`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {isDone ? (
                  <Check size={13} strokeWidth={2.4} className="text-emerald-500" />
                ) : isActive ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              {stage.label}
              {counter}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
const CATEGORY_LABELS = {
  accessibility: "Accessibility",
  seo: "SEO",
  hierarchy: "Hierarchy",
  spacing: "Design System",
  layout: "Layout",
  performance: "Performance",
  responsive: "Responsive",
};

export default function AICopilot({ isOpen, onClose }) {
  const components = useEditorStore((state) => state.components);
  const selectedComponentId = useEditorStore((state) => state.selectedIds[0] ?? null);
  
  const [activeTab, setActiveTab] = useState("chat");
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState(conversationManager.getChatHistory());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);

  const [auditIssues, setAuditIssues] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // What the last AI turn did to the canvas, so it can be reviewed or rejected.
  const [lastChange, setLastChange] = useState(null);

  // Load any conversation history saved for this hackathon so refreshing the
  // page doesn't lose the chat. No-op if there's already a local, in-progress
  // conversation (see MemoryManager.hydrate).
  useEffect(() => {
    conversationManager.hydrate().then(() => {
      setChatHistory(conversationManager.getChatHistory());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAIChangedIds = useEditorStore((state) => state.setAIChangedIds);

  const rejectLastChange = () => {
    conversationManager.revertChange(lastChange);
    setLastChange(null);
    setAIChangedIds([]);
  };

  const keepLastChange = () => {
    setLastChange(null);
    setAIChangedIds([]);
  };

  // The canvas markers describe the last turn; closing the panel ends it.
  useEffect(() => () => setAIChangedIds([]), [setAIChangedIds]);

  // Follow the conversation: a reply that lands below the fold reads as no reply.
  const scrollRef = React.useRef(null);
  useEffect(() => {
    const list = scrollRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chatHistory, isGenerating, progress, lastChange]);

  const selectedNode = React.useMemo(() => {
    let found = null;
    const findNode = (nodes) => {
      if(!nodes) return;
      for(let n of nodes) {
        if(n.id === selectedComponentId) { found = n; return; }
        if(n.children) findNode(n.children);
      }
    }
    findNode(components);
    return found;
  }, [components, selectedComponentId]);

  const suggestions = React.useMemo(() => {
    if (!selectedNode) return ["Generate a hero section.", "Improve SEO."];
    const s = [];
    if (selectedNode.type === "image" && !selectedNode.props?.alt) s.push("Add alt text to this image.");
    if (selectedNode.type === "button" && (!selectedNode.props?.text || selectedNode.props.text.trim() === "")) s.push("Add text to this button.");
    if (selectedNode.styles?.padding && parseInt(selectedNode.styles.padding) % 8 !== 0) s.push("Fix padding to match 8px grid.");
    if (s.length === 0) s.push(`Make this ${selectedNode.type} dark.`, `Delete this ${selectedNode.type}.`);
    return s.slice(0, 2);
  }, [selectedNode]);

  const handleSendPrompt = async (e, directPrompt = null) => {
    if (e) e.preventDefault();
    const userMsg = directPrompt || prompt.trim();
    if (!userMsg || isGenerating) return;

    setPrompt("");
    
    // Optimistic UI update for user message
    setChatHistory([...conversationManager.getChatHistory(), { role: "user", content: userMsg }]);
    setIsGenerating(true);
    setProgress({ stage: "reading" });

    try {
      const { change } = await conversationManager.handleUserPrompt(userMsg, setProgress);
      setChatHistory([...conversationManager.getChatHistory()]);
      setLastChange(change?.changed ? change : null);
      // Ring the edits on the canvas, so the result is visible where the page
      // is rather than only described in the chat.
      setAIChangedIds(change?.ids || []);
    } catch (err) {
      console.error(err);
      setChatHistory([...conversationManager.getChatHistory(), { 
        role: "ai", 
        content: err.message || "Sorry, I couldn't process that request." 
      }]);
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      // Structured findings straight from the analyzers -- no parsing prose.
      const { findings } = runFullAudit(components);
      setAuditIssues(
        findings
          .slice()
          .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
          .map((finding) => ({
            type: CATEGORY_LABELS[finding.category] || finding.category,
            severity: finding.severity,
            message: finding.fix ? `${finding.message} ${finding.fix}` : finding.message,
          })),
      );
    } catch (err) {
      console.error(err);
      setAuditIssues([{ type: "Error", severity: "high", message: err.message || "The audit could not be completed." }]);
    } finally {
      setIsAuditing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-14 bottom-0 z-[90] flex w-[380px] max-w-full flex-col border-l border-[#E7E8F4] bg-white shadow-[-12px_0_32px_rgba(19,2,37,0.08)]">
      {/* Header — a quiet strip, not a coloured banner competing with the canvas */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#EFEDF6] px-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-[#2B0A5A]" strokeWidth={1.8} />
          <span className="text-[13px] font-semibold text-[#130225]">Assistant</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close assistant"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8A8697] transition-colors hover:bg-[#F4F2FA] hover:text-[#130225]"
        >
          <X size={15} strokeWidth={1.8} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 gap-1 border-b border-[#EFEDF6] px-3 pb-2 pt-2">
        {[
          { id: "chat", label: "Generate", icon: MessageSquare },
          { id: "audit", label: "Audit", icon: ShieldCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12.5px] font-medium transition-colors
              ${activeTab === id ? "bg-[#F1EEF9] text-[#2B0A5A]" : "text-[#8A8697] hover:bg-[#F6F5FB] hover:text-[#5E5B6B]"}`}
          >
            <Icon size={14} strokeWidth={1.8} /> {label}
          </button>
        ))}
      </div>

      {/* Chat Interface */}
      {activeTab === "chat" && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {chatHistory.length === 0 && !isGenerating && (
              <div className="pt-6 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1EEF9] text-[#2B0A5A]">
                  <Sparkles size={19} strokeWidth={1.8} />
                </span>
                <p className="mt-3 text-[13px] font-semibold text-[#130225]">Describe the change you want</p>
                <p className="mx-auto mt-1 max-w-[250px] text-[12px] leading-relaxed text-slate-500">
                  Plain English is fine — “make the hero headline shorter and the button orange”.
                </p>
              </div>
            )}

            {chatHistory.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isSystem = msg.role === "system";

              if (isSystem) {
                return (
                  <div key={idx} className="my-2 flex justify-center">
                    <span className="rounded-full border border-[#EFEDF6] bg-[#FAF9FD] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed
                    ${isUser
                      ? "rounded-br-md bg-[#2B0A5A] text-white"
                      : "rounded-bl-md border border-[#E7E8F4] bg-white text-slate-700 shadow-sm"
                    }
                  `}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {isGenerating && (
              <div className="flex justify-start">
                <GenerationProgress progress={progress} />
              </div>
            )}
          </div>
          
          {lastChange && (
            <div className="mx-3 mb-2 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-2 bg-violet-50 px-3 py-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] font-semibold text-[#2B0A5A]">
                  <Check size={12} strokeWidth={2.6} className="shrink-0 text-emerald-600" />
                  <span className="truncate">
                    {lastChange.pageSwitched
                      ? `Opened another page — you were on ${lastChange.fromPageName}`
                      : lastChange.summary}
                  </span>
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  {/* A page switch clears the undo stack, so its way back is
                      reopening the old page, not an undo. */}
                  {(lastChange.undoSteps > 0 || lastChange.pageSwitched) && (
                    <button
                      onClick={rejectLastChange}
                      className="rounded-lg border border-[#E7E8F4] bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      {lastChange.pageSwitched ? `Back to ${lastChange.fromPageName}` : "Undo this"}
                    </button>
                  )}
                  <button
                    onClick={keepLastChange}
                    className="rounded-lg bg-[#2B0A5A] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#1d0342]"
                  >
                    Keep
                  </button>
                </div>
              </div>

              {lastChange.lines?.length > 0 && (
                <ul className="divide-y divide-[#F1EEF9]">
                  {lastChange.lines.map((line, i) => (
                    <li key={i} className="truncate px-3 py-1.5 text-[11px] leading-relaxed text-slate-600" title={line}>
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form onSubmit={(e) => handleSendPrompt(e)} className="shrink-0 border-t border-[#EFEDF6] bg-white px-3 pb-3 pt-2.5">
            {suggestions.length > 0 && (
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendPrompt(null, sug)}
                    disabled={isGenerating}
                    className="whitespace-nowrap rounded-full border border-[#E7E8F4] bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-[#2B0A5A] disabled:opacity-50"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex items-center">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={1000}
                aria-label="AI design request"
                placeholder="Describe a change to this page…"
                className="w-full rounded-xl border border-[#E7E8F4] bg-[#FAF9FD] py-2.5 pl-3.5 pr-11 text-[13px] outline-none transition focus:border-violet-400 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                aria-label="Send"
                className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#2B0A5A] text-white transition hover:bg-[#1d0342] disabled:bg-[#D9D5E4]"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audit Interface */}
      {activeTab === "audit" && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          {!auditIssues ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center text-[#2B0A5A] mb-2">
                <Search size={28} />
              </div>
              <h3 className="font-semibold text-slate-800">Run a complete site audit</h3>
              <p className="text-xs text-slate-500 px-4">AI will scan your project for Accessibility, SEO, and UX flaws.</p>
              <button 
                onClick={runAudit}
                disabled={isAuditing}
                className="mt-4 bg-[#2B0A5A] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1d0342] transition flex items-center gap-2"
              >
                {isAuditing ? "Scanning..." : "Start Audit"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-800">Audit Results</h3>
                <button onClick={runAudit} className="text-xs text-[#2B0A5A] font-medium hover:underline">Re-scan</button>
              </div>

              {auditIssues.length === 0 ? (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm flex items-start gap-3">
                  <ShieldCheck className="shrink-0 mt-0.5" size={18} />
                  Perfect! No major SEO, Accessibility, or UX issues detected.
                </div>
              ) : (
                auditIssues.map((issue, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3
                    ${issue.severity === 'high' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'}
                  `}>
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{issue.type}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold uppercase
                          ${issue.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}
                        `}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">{issue.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
