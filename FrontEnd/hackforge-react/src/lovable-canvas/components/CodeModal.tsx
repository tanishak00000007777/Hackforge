import React, { useState } from 'react';
import { X, Copy, Check, Code2, Terminal } from 'lucide-react';
import { CanvasItem } from '../types';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CanvasItem[];
}

export const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose, items }) => {
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'jsx' | 'html' | 'json'>('jsx');

  if (!isOpen) return null;

  // Generate clean React / JSX / Tailwind Code
  const generateJSXCode = (): string => {
    return `import React from 'react';
import { Sparkles, ArrowRight, Search, Zap, Shield, Check, Star } from 'lucide-react';

export default function GeneratedCanvasPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 max-w-7xl mx-auto">
${items.map(item => {
  const { type, props } = item;
  switch (type) {
    case 'navbar':
      return `      {/* Navbar Block */}
      <nav className="w-full bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 font-bold text-base text-white">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>${props.brandName || 'Acme Studio'}</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-300 font-medium">
          ${(props.links || ['Features', 'Pricing', 'Docs']).map((l: string) => `<span>${l}</span>`).join('\n          ')}
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg">
          ${props.ctaText || 'Get Started'}
        </button>
      </nav>`;

    case 'hero':
      return `      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 md:p-12 text-center shadow-lg">
        ${props.badge ? `<span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-4">${props.badge}</span>` : ''}
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto mb-4">
          ${props.title || 'Build Web Apps Fast'}
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
          ${props.subtitle || 'Compose sleek responsive components with instant code export.'}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20">
            ${props.primaryCta || 'Start Free'}
          </button>
        </div>
      </section>`;

    case 'heading':
      return `      {/* Heading Block */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">${props.tag || 'H2'}</span>
        <h2 className="text-2xl font-bold text-white mt-1 mb-2">${props.title || 'Section Title'}</h2>
        <p className="text-sm text-slate-400">${props.subtitle || 'Subtext description'}</p>
      </div>`;

    default:
      return `      {/* ${item.title} */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-bold text-lg text-white mb-2">${props.title || item.title}</h3>
        <p className="text-sm text-slate-400">${props.subtitle || props.description || 'Interactive Canvas Component'}</p>
      </div>`;
  }
}).join('\n\n')}
    </div>
  );
}
`;
  };

  const getFormattedCode = () => {
    if (selectedFormat === 'json') {
      return JSON.stringify(items, null, 2);
    }
    return generateJSXCode();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getFormattedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="code-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-800">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-200/80 rounded-lg text-indigo-600">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Export Production Source Code</h2>
              <p className="text-xs text-slate-500">Clean React, TypeScript, & Tailwind CSS output</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Switcher */}
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs flex gap-1">
              <button
                onClick={() => setSelectedFormat('jsx')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedFormat === 'jsx' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                React (TSX)
              </button>
              <button
                onClick={() => setSelectedFormat('json')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedFormat === 'json' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grid Schema (JSON)
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-indigo-100 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Output Body */}
        <div className="flex-1 overflow-auto p-4 bg-slate-900 font-mono text-xs text-slate-200 custom-scrollbar m-2 rounded-xl border border-slate-800 shadow-inner">
          <pre className="whitespace-pre">
            <code>{getFormattedCode()}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>Ready for copy-paste into Vite / Next.js projects</span>
          </div>
          <span>{items.length} canvas components formatted</span>
        </div>
      </div>
    </div>
  );
};
