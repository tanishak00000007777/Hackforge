import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Grid,
  Layers,
  Palette,
  Type,
  MousePointerClick,
  Image as ImageIcon,
  Navigation,
  LayoutTemplate,
  Bot,
  CreditCard,
  Quote,
  HelpCircle,
  Trash2,
  Copy,
  Search,
  Check,
  Wand2,
  Loader2
} from 'lucide-react';
import { CanvasItem, ComponentType, CanvasBackground } from '../types';
import { COMPONENT_TEMPLATES } from '../data/componentTemplates';

interface SidebarProps {
  onAddItem: (type: ComponentType) => void;
  items: CanvasItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  canvasBg: CanvasBackground;
  onChangeCanvasBg: (bg: CanvasBackground) => void;
  onGenerateAIComponent: (prompt: string, replaceCanvas?: boolean) => Promise<void>;
  isGeneratingAI: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onAddItem,
  items,
  selectedItemId,
  onSelectItem,
  onDeleteItem,
  onDuplicateItem,
  canvasBg,
  onChangeCanvasBg,
  onGenerateAIComponent,
  isGeneratingAI,
}) => {
  const [activeTab, setActiveTab] = useState<'components' | 'layers' | 'settings'>('components');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [replaceCanvas, setReplaceCanvas] = useState(false);

  // Icon resolver for template icons
  const renderIcon = (name: string) => {
    switch (name) {
      case 'Type': return <Type className="w-4 h-4 text-indigo-600" />;
      case 'MousePointerClick': return <MousePointerClick className="w-4 h-4 text-emerald-600" />;
      case 'Image': return <ImageIcon className="w-4 h-4 text-sky-600" />;
      case 'Navigation': return <Navigation className="w-4 h-4 text-violet-600" />;
      case 'LayoutTemplate': return <LayoutTemplate className="w-4 h-4 text-amber-600" />;
      case 'Bot': return <Bot className="w-4 h-4 text-pink-600" />;
      case 'Grid': return <Grid className="w-4 h-4 text-teal-600" />;
      case 'CreditCard': return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'Quote': return <Quote className="w-4 h-4 text-purple-600" />;
      case 'HelpCircle': return <HelpCircle className="w-4 h-4 text-orange-600" />;
      default: return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  const filteredTemplates = COMPONENT_TEMPLATES.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAIGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGeneratingAI) return;
    onGenerateAIComponent(aiPrompt.trim(), replaceCanvas);
    setAiPrompt('');
  };

  const quickPrompts = [
    'Complete SaaS Landing Page',
    'Developer Portfolio Site',
    'E-Commerce Storefront',
    'AI Photo Editor Website',
    'Fitness App Website'
  ];

  return (
    <aside id="sidebar-panel" className="w-72 md:w-80 bg-white/90 backdrop-blur-md border-r border-slate-200 flex flex-col h-[calc(100vh-3.5rem)] z-20 select-none shadow-sm text-slate-800">
      {/* Top Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1">
        <button
          id="tab-components-btn"
          onClick={() => setActiveTab('components')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'components'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Library</span>
        </button>
        <button
          id="tab-layers-btn"
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all relative ${
            activeTab === 'layers'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
          {items.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {items.length}
            </span>
          )}
        </button>
        <button
          id="tab-settings-btn"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Canvas</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {activeTab === 'components' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search component library..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Core Required Components Label */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  UI Elements
                </span>
                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                  Click to Add
                </span>
              </div>

              {/* Component Cards Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.type}
                    id={`add-component-${template.type}`}
                    onClick={() => onAddItem(template.type)}
                    className="group p-3 bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md flex items-start gap-3 relative overflow-hidden"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200/80 flex items-center justify-center shrink-0 transition-colors">
                      {renderIcon(template.iconName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                          {template.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {template.defaultGrid.w}x{template.defaultGrid.h}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 self-center">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layers / Component Tree Tab */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Canvas Layers ({items.length})
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-medium text-slate-600">Canvas is Empty</p>
                <p className="text-[11px] mt-1 text-slate-400">Add components from the library or use AI prompt.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {items.map((item, idx) => {
                  const isSelected = selectedItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item.id)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 font-medium shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-mono text-slate-500">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Pos: ({item.grid.x}, {item.grid.y}) • {item.grid.w}x{item.grid.h}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateItem(item.id);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                          title="Duplicate item"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Canvas Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Canvas Workspace Pattern
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChangeCanvasBg('dot')}
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                    canvasBg === 'dot'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-8 rounded bg-slate-100 bg-grid-pattern border border-slate-200" />
                  <span>Dot Grid (Default)</span>
                </button>
                <button
                  onClick={() => onChangeCanvasBg('blueprint')}
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                    canvasBg === 'blueprint'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-8 rounded bg-sky-950/80 border border-sky-800/80 bg-grid-pattern-dark" />
                  <span>Blueprint Grid</span>
                </button>
                <button
                  onClick={() => onChangeCanvasBg('clean')}
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                    canvasBg === 'clean'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-8 rounded bg-slate-100 border border-slate-200" />
                  <span>Clean White</span>
                </button>
                <button
                  onClick={() => onChangeCanvasBg('dark')}
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                    canvasBg === 'dark'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-8 rounded bg-slate-900 border border-slate-800" />
                  <span>SaaS Dark</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Strict Non-Overlapping Rules</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                12-column grid enforces vertical compaction and zero collisions. Items automatically step aside on drag or resize.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom AI Prompt Box */}
      <div id="ai-prompt-box" className="p-4 bg-white border-t border-slate-200 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI Full Website Builder</span>
          </div>
          <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">HackForge AI</span>
        </div>

        {/* Quick prompt chips */}
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => setAiPrompt(qp)}
              className="text-[10px] text-slate-600 bg-slate-100 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 px-2 py-0.5 rounded-full whitespace-nowrap transition-colors"
            >
              + {qp}
            </button>
          ))}
        </div>

        <form onSubmit={handleAIGenerateSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              id="ai-prompt-textarea"
              rows={2}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe a full website or section... (e.g. 'Build a complete website for an AI video app with hero, pricing and FAQ')"
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-none placeholder:text-slate-400 text-slate-800 transition-colors pr-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAIGenerateSubmit(e);
                }
              }}
            />
            <button
              id="ai-generate-submit-btn"
              type="submit"
              disabled={!aiPrompt.trim() || isGeneratingAI}
              className="absolute right-2 bottom-3 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-all shadow-sm shadow-indigo-100 active:scale-95"
              title="Generate Whole Website with AI"
            >
              {isGeneratingAI ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500 hover:text-slate-700">
              <input
                type="checkbox"
                checked={replaceCanvas}
                onChange={(e) => setReplaceCanvas(e.target.checked)}
                className="w-3 h-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Replace current canvas</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">Generates 4-7 sections</span>
          </div>
        </form>
      </div>
    </aside>
  );
};
