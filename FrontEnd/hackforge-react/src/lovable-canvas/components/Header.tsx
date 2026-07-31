import React from 'react';
import {
  Sparkles,
  Undo2,
  Redo2,
  Code2,
  Eye,
  EyeOff,
  Share2,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import { ViewportMode } from '../types';

interface HeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenCode: () => void;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onOpenPublish: () => void;
  viewportMode: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  itemCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenCode,
  isPreviewMode,
  onTogglePreview,
  onOpenPublish,
  viewportMode,
  onViewportChange,
  itemCount,
}) => {
  return (
    <header id="main-header" className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between z-30 sticky top-0 select-none text-slate-800 shadow-sm">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base tracking-tight text-slate-800">
              HackForge Hackathon Builder
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>{itemCount} {itemCount === 1 ? 'element' : 'elements'}</span>
          </p>
        </div>
      </div>

      {/* Center Viewport Controls */}
      {!isPreviewMode && (
        <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200/80">
          <button
            id="viewport-desktop-btn"
            onClick={() => onViewportChange('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewportMode === 'desktop'
                ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Desktop 12-Column Canvas (100% Width)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            id="viewport-tablet-btn"
            onClick={() => onViewportChange('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewportMode === 'tablet'
                ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Tablet Viewport (768px Width)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            id="viewport-mobile-btn"
            onClick={() => onViewportChange('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewportMode === 'mobile'
                ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Mobile Viewport (390px Width)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      )}

      {/* Right Action Controls */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200">
          <button
            id="undo-btn"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md text-slate-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="redo-btn"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md text-slate-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Code Button */}
        <button
          id="view-code-btn"
          onClick={onOpenCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 transition-all shadow-xs active:scale-95"
        >
          <Code2 className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">View Code</span>
        </button>

        {/* Live Preview Toggle */}
        <button
          id="live-preview-btn"
          onClick={onTogglePreview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-xs active:scale-95 border ${
            isPreviewMode
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 font-semibold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
        >
          {isPreviewMode ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
              <span>Edit Canvas</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Preview</span>
            </>
          )}
        </button>

        {/* Export / Publish Button */}
        <button
          id="export-publish-btn"
          onClick={onOpenPublish}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 active:scale-95 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Publish</span>
        </button>
      </div>
    </header>
  );
};
