import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Trash2,
  Copy,
  Wand2,
  Settings2,
  Loader2
} from 'lucide-react';
import { CanvasItem } from '../types';

interface ComponentInspectorProps {
  item: CanvasItem | null;
  onClose: () => void;
  onUpdateProps: (id: string, newProps: Record<string, any>) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onRefineWithAI: (id: string, instructions: string) => Promise<void>;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  item,
  onClose,
  onUpdateProps,
  onDeleteItem,
  onDuplicateItem,
  onRefineWithAI,
}) => {
  const [aiInstructions, setAiInstructions] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  if (!item) return null;

  const handlePropChange = (key: string, value: any) => {
    onUpdateProps(item.id, {
      ...item.props,
      [key]: value,
    });
  };

  const handleAIRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInstructions.trim() || isRefining) return;
    setIsRefining(true);
    await onRefineWithAI(item.id, aiInstructions);
    setIsRefining(false);
    setAiInstructions('');
  };

  return (
    <div id="component-inspector-panel" className="w-80 bg-white/90 backdrop-blur-md border-l border-slate-200 flex flex-col h-[calc(100vh-3.5rem)] z-20 select-none shadow-sm text-slate-800">
      {/* Panel Header */}
      <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-600" />
          <div>
            <h3 className="font-bold text-xs text-slate-800">{item.title}</h3>
            <span className="text-[10px] text-slate-500 font-mono uppercase">{item.type}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Form Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Quick Actions */}
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <button
            onClick={() => onDuplicateItem(item.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-600" />
            <span>Duplicate</span>
          </button>
          <button
            onClick={() => onDeleteItem(item.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-all border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete</span>
          </button>
        </div>

        {/* AI Polish Field */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
            <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Refine Component with AI</span>
          </div>
          <form onSubmit={handleAIRefineSubmit} className="space-y-2">
            <input
              type="text"
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder="e.g. 'Make title punchier' or 'Change text to green'..."
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!aiInstructions.trim() || isRefining}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100 transition-all"
            >
              {isRefining ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Refining with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply AI Polish</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Editable Props Depending on Type */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Editable Component Content
          </span>

          {/* Title input */}
          {'title' in item.props && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Title / Headline
              </label>
              <input
                type="text"
                value={item.props.title || ''}
                onChange={(e) => handlePropChange('title', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              />
            </div>
          )}

          {/* Subtitle / Subtext input */}
          {'subtitle' in item.props && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Subtitle / Subtext
              </label>
              <textarea
                rows={2}
                value={item.props.subtitle || ''}
                onChange={(e) => handlePropChange('subtitle', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Badge text */}
          {'badge' in item.props && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Badge Text
              </label>
              <input
                type="text"
                value={item.props.badge || ''}
                onChange={(e) => handlePropChange('badge', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              />
            </div>
          )}

          {/* Brand Name */}
          {'brandName' in item.props && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={item.props.brandName || ''}
                onChange={(e) => handlePropChange('brandName', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              />
            </div>
          )}

          {/* Primary CTA Label */}
          {'ctaText' in item.props && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                value={item.props.ctaText || ''}
                onChange={(e) => handlePropChange('ctaText', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              />
            </div>
          )}

          {/* Primary CTA Hero */}
          {'primaryCta' in item.props && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Primary Button Text
              </label>
              <input
                type="text"
                value={item.props.primaryCta || ''}
                onChange={(e) => handlePropChange('primaryCta', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              />
            </div>
          )}

          {/* Image URL */}
          {'imageUrl' in item.props && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Image Source URL
              </label>
              <input
                type="text"
                value={item.props.imageUrl || ''}
                onChange={(e) => handlePropChange('imageUrl', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none font-mono"
              />
            </div>
          )}

          {/* Grid Dimensions */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">
              12-Column Grid Dimensions
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <span className="text-slate-500">Width (cols):</span>
                <span className="font-bold font-mono text-indigo-600">{item.grid.w} / 12</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <span className="text-slate-500">Height (units):</span>
                <span className="font-bold font-mono text-indigo-600">{item.grid.h}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
