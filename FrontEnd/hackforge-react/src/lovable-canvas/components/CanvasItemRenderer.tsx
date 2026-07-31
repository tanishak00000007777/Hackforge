import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Search,
  Zap,
  Star,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { CanvasItem } from '../types';

interface CanvasItemRendererProps {
  item: CanvasItem;
  isPreviewMode?: boolean;
}

export const CanvasItemRenderer: React.FC<CanvasItemRendererProps> = ({ item }) => {
  const { type, props } = item;

  switch (type) {
    case 'navbar':
      return (
        <div id={`render-navbar-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-3 px-5 flex items-center justify-between shadow-xs text-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-800 tracking-tight">
              {props.brandName || 'Acme Studio'}
            </span>
          </div>

          {props.links && Array.isArray(props.links) && (
            <div className="hidden md:flex items-center gap-6 text-xs text-slate-600 font-medium">
              {props.links.map((link: string, idx: number) => (
                <span key={idx} className="hover:text-indigo-600 cursor-pointer transition-colors">
                  {link}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            {props.showSearch && (
              <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-500">
                <Search className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <span>Search...</span>
              </div>
            )}
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm shadow-indigo-100 transition-all">
              {props.ctaText || 'Get Started'}
            </button>
          </div>
        </div>
      );

    case 'hero':
      return (
        <div id={`render-hero-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-xs">
          {props.showGlow && (
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
          )}

          {props.badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200/80 mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{props.badge}</span>
            </span>
          )}

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight max-w-2xl leading-tight mb-3">
            {props.title || 'Build Web Apps at the Speed of Thought'}
          </h1>

          <p className="text-xs md:text-sm text-slate-600 max-w-xl leading-relaxed mb-6">
            {props.subtitle || 'Compose sleek, responsive components on a smart non-overlapping canvas with instant export.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition-all">
              <span>{props.primaryCta || 'Start Free'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {props.secondaryCta && (
              <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all">
                {props.secondaryCta}
              </button>
            )}
          </div>
        </div>
      );

    case 'heading':
      return (
        <div id={`render-heading-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
              {props.tag || 'H2'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1.5">
            {props.title || 'Section Title'}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {props.subtitle || 'Add subtitle or descriptive copy here.'}
          </p>
          {props.showDivider && (
            <div className="w-12 h-1 bg-indigo-500 rounded-full mt-3" />
          )}
        </div>
      );

    case 'button':
      return (
        <div id={`render-button-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-4 flex items-center justify-center">
          <button className="w-full h-full min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-98">
            <span>{props.label || 'Action Button'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      );

    case 'image_card':
      return (
        <div id={`render-imagecard-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-3 flex flex-col justify-between overflow-hidden shadow-xs group">
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100 mb-3">
            <img
              src={props.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'}
              alt="Card Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {props.tag && (
              <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/90 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-md backdrop-blur-xs">
                {props.tag}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
              {props.title || 'Featured Card Title'}
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
              {props.description || 'Description text explaining this feature card.'}
            </p>
          </div>
          <button className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1 transition-colors mt-auto">
            <span>{props.actionText || 'Read More'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );

    case 'ai_container':
      return (
        <div id={`render-aicontainer-${item.id}`} className="w-full h-full bg-white/90 backdrop-blur-md border border-indigo-200 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-bold text-xs text-slate-800">{props.title || 'AI Generated Widget'}</h3>
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {props.statusText || 'Active AI'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-1">
            {(props.metrics || [
              { label: 'Density', value: '100%', change: 'Optimal', positive: true },
              { label: 'Collisions', value: '0', change: 'Zero', positive: true },
              { label: 'Grid', value: '16px', change: 'Balanced', positive: true }
            ]).map((metric: any, idx: number) => (
              <div key={idx} className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg text-center">
                <span className="text-[10px] text-slate-500 block truncate">{metric.label}</span>
                <span className="text-sm font-extrabold text-slate-800 my-0.5 block">{metric.value}</span>
                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                  {metric.change}
                </span>
              </div>
            ))}
          </div>

          {props.aiPromptUsed && (
            <p className="text-[10px] text-slate-400 italic truncate mt-2">
              Prompt: "{props.aiPromptUsed}"
            </p>
          )}
        </div>
      );

    case 'features':
      return (
        <div id={`render-features-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-5 flex flex-col justify-center">
          <h3 className="font-extrabold text-sm text-slate-800 text-center mb-4">
            {props.sectionTitle || 'Core Features'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(props.items || [
              { icon: 'Zap', title: 'Speed', desc: 'Fast grid layout' },
              { icon: 'Shield', title: 'Security', desc: 'Clean TypeScript' },
              { icon: 'Sparkles', title: 'AI', desc: 'Instant components' }
            ]).map((feat: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg">
                <div className="w-6 h-6 rounded bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-2">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-semibold text-xs text-slate-800 mb-1">{feat.title}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'pricing':
      return (
        <div id={`render-pricing-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-5 flex flex-col justify-center">
          <h3 className="font-extrabold text-sm text-slate-800 text-center mb-4">
            {props.title || 'Flexible Pricing Plans'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(props.plans || [
              { name: 'Starter', price: '$0', desc: 'For individuals' },
              { name: 'Pro Plan', price: '$29', desc: 'Best value', popular: true },
              { name: 'Enterprise', price: '$99', desc: 'For teams' }
            ]).map((plan: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  plan.popular
                    ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div>
                  {plan.popular && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200 float-right">
                      Popular
                    </span>
                  )}
                  <h4 className="font-bold text-xs text-slate-800">{plan.name}</h4>
                  <div className="my-2">
                    <span className="text-xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-[10px] text-slate-500"> /mo</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight mb-2">{plan.desc}</p>
                </div>
                <button className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  plan.popular ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                  Choose Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div id={`render-testimonials-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-5 flex flex-col justify-center">
          <h3 className="font-extrabold text-sm text-slate-800 text-center mb-4">
            {props.title || 'Customer Reviews'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(props.items || [
              { name: 'Alex Rivera', role: 'CTO', quote: 'The drag and drop performance is flawless.' },
              { name: 'Samantha Vance', role: 'Design Lead', quote: 'Zero collisions make component building enjoyable again.' }
            ]).map((item: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                  {item.name ? item.name.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-700 italic mb-1.5">"{item.quote}"</p>
                  <p className="text-[10px] font-bold text-slate-800">{item.name}</p>
                  <p className="text-[9px] text-slate-500">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div id={`render-faq-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-5 flex flex-col justify-center">
          <h3 className="font-extrabold text-sm text-slate-800 mb-3">
            {props.title || 'Frequently Asked Questions'}
          </h3>
          <div className="space-y-2">
            {(props.items || [
              { q: 'Is code export supported?', a: 'Yes, full React and Tailwind code is generated.' },
              { q: 'How does grid snapping work?', a: 'Grid layout compacts vertically with 16px margins.' }
            ]).map((faq: any, idx: number) => (
              <div key={idx} className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5 mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-[11px] text-slate-600 pl-5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'stats':
      return (
        <div id={`render-stats-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-5 flex flex-col justify-center">
          <h3 className="font-extrabold text-sm text-slate-800 text-center mb-4">
            {props.title || 'Proven Impact & Key Metrics'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(props.items || [
              { label: 'Active Users', value: '100K+' },
              { label: 'Uptime SLA', value: '99.99%' },
              { label: 'Code Saved', value: '500 hrs' },
              { label: 'Customer CSAT', value: '4.9/5' }
            ]).map((stat: any, idx: number) => (
              <div key={idx} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center">
                <span className="text-xl md:text-2xl font-extrabold text-indigo-600 block">{stat.value}</span>
                <span className="text-[11px] text-slate-600 font-medium block mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'contact':
      return (
        <div id={`render-contact-${item.id}`} className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-5 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full text-center mb-3">
            <h3 className="font-extrabold text-sm text-slate-800 mb-1">{props.title || 'Get in Touch'}</h3>
            <p className="text-xs text-slate-500">{props.subtitle || 'Send us a message and our team will get back to you shortly.'}</p>
          </div>
          <div className="space-y-2 max-w-sm mx-auto w-full">
            <input type="text" placeholder="Your Name" className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            <input type="email" placeholder="Your Email" className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-indigo-100 transition-all">
              {props.ctaText || 'Send Message'}
            </button>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center text-center">
          <Sparkles className="w-6 h-6 text-indigo-600 mb-2" />
          <h3 className="font-bold text-xs text-slate-800">{item.title}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Generic Component Box</p>
        </div>
      );
  }
};
