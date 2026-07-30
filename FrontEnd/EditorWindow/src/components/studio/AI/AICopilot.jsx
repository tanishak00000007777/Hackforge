import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { conversationManager } from "@/services/ai/ConversationManager";
import { runFullAudit } from "@/services/ai/tools/analysisTools";
import { Sparkles, MessageSquare, ShieldCheck, Search, AlertCircle, X, Send } from "lucide-react";

const SEVERITY_RANK = { low: 0, medium: 1, high: 2 };
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

  const rejectLastChange = () => {
    conversationManager.revertChange(lastChange);
    setLastChange(null);
  };

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

    try {
      const { change } = await conversationManager.handleUserPrompt(userMsg);
      setChatHistory([...conversationManager.getChatHistory()]);
      setLastChange(change?.changed ? change : null);
    } catch (err) {
      console.error(err);
      setChatHistory([...conversationManager.getChatHistory(), { 
        role: "ai", 
        content: err.message || "Sorry, I couldn't process that request." 
      }]);
    } finally {
      setIsGenerating(false);
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isSystem = msg.role === "system";
              
              if (isSystem) {
                return (
                  <div key={idx} className="flex justify-center my-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      {msg.content}
                    </span>
                  </div>
                );
              }
              
              return (
                <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] break-words whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm
                    ${isUser 
                      ? "bg-[#2B0A5A] text-white rounded-tr-sm" 
                      : "bg-slate-100 text-slate-700 rounded-tl-sm border border-slate-200"
                    }
                  `}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 text-slate-500 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                </div>
              </div>
            )}
          </div>
          
          {lastChange && (
            <div className="mx-3 mb-2 rounded-xl border border-violet-200 bg-violet-50/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                  {lastChange.pageSwitched ? "Page changed" : `Applied — ${lastChange.summary}`}
                </span>
                <div className="flex items-center gap-1">
                  {lastChange.undoSteps > 0 && (
                    <button
                      onClick={rejectLastChange}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      Undo this
                    </button>
                  )}
                  <button
                    onClick={() => setLastChange(null)}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100"
                  >
                    Keep
                  </button>
                </div>
              </div>

              {lastChange.lines?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {lastChange.lines.map((line, i) => (
                    <li key={i} className="truncate font-mono text-[10.5px] leading-relaxed text-slate-600" title={line}>
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="p-3 bg-slate-50 border-t border-slate-100">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {suggestions.map((sug, i) => (
                <button 
                  key={i}
                  onClick={() => handleSendPrompt(null, sug)}
                  className="whitespace-nowrap px-3 py-1.5 bg-white border border-violet-100 rounded-full text-[11px] text-violet-700 font-medium shadow-sm hover:bg-violet-50 transition"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={(e) => handleSendPrompt(e)} className="p-4 border-t border-slate-100 bg-white">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                maxLength={1000}
                aria-label="AI design request"
                placeholder="Ask AI to generate a section..."
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-2.5 text-[13px] outline-none focus:border-violet-500 focus:bg-white transition"
              />
              <button 
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="absolute right-1 w-8 h-8 flex items-center justify-center bg-[#2B0A5A] text-white rounded-full disabled:opacity-50 disabled:bg-slate-300 transition"
              >
                <Send size={14} />
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
