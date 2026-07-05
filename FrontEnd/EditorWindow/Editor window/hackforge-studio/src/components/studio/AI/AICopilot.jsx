import React, { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { generateSection, auditProject } from "@/services/AIService";
import { catalogueMetadata } from "@/builder/registry/catalogue";
import { Sparkles, MessageSquare, ShieldCheck, Search, AlertCircle, X, Send } from "lucide-react";

export default function AICopilot({ isOpen, onClose }) {
  const components = useEditorStore((state) => state.components);
  const globalTheme = useEditorStore((state) => state.globalTheme);
  const addComponent = useEditorStore((state) => state.addComponent);
  
  const [activeTab, setActiveTab] = useState("chat");
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "ai", content: "Hi! I'm your ForgeAI Assistant. Try asking me to 'Generate a hero section for my startup'." }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [auditIssues, setAuditIssues] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const handleSendPrompt = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const userMsg = prompt.trim();
    setPrompt("");
    setChatHistory(prev => [...prev, { role: "user", content: userMsg }]);
    setIsGenerating(true);

    try {
      const node = await generateSection(userMsg);
      const meta = catalogueMetadata[node.type];
      
      // If it's an element instead of a section, give it default coordinates so it doesn't get lost
      if (meta?.category !== "Sections") {
        node.styles = {
          ...node.styles,
          position: "absolute",
          left: "200px",
          top: "200px",
          zIndex: "10"
        };
      }
      
      addComponent(node);
      setChatHistory(prev => [...prev, { 
        role: "ai", 
        content: `I've generated and added a new ${node.type} to your canvas!` 
      }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { 
        role: "ai", 
        content: "Sorry, I couldn't understand that request. Try asking for a specific section type." 
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const runAudit = async () => {
    setIsAuditing(true);
    const issues = await auditProject(components, globalTheme);
    setAuditIssues(issues);
    setIsAuditing(false);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-[64px] right-0 bottom-0 w-[350px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.05)] border-l border-slate-200 z-[90] flex flex-col transform transition-transform">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles size={18} />
          ForgeAI Assistant
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-md transition">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        <button 
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "chat" ? "text-[#2B0A5A] border-b-2 border-violet-600 bg-white" : "text-slate-500 hover:text-slate-700"}`}
        >
          <MessageSquare size={16} /> Generate
        </button>
        <button 
          onClick={() => setActiveTab("audit")}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "audit" ? "text-[#2B0A5A] border-b-2 border-violet-600 bg-white" : "text-slate-500 hover:text-slate-700"}`}
        >
          <ShieldCheck size={16} /> Audit Project
        </button>
      </div>

      {/* Chat Interface */}
      {activeTab === "chat" && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm
                  ${msg.role === "ai" ? "bg-slate-100 text-slate-700 rounded-tl-sm" : "bg-[#2B0A5A] text-white rounded-tr-sm"}
                `}>
                  {msg.content}
                </div>
              </div>
            ))}
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
          
          <form onSubmit={handleSendPrompt} className="p-4 border-t border-slate-100 bg-white">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
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
