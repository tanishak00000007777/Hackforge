import { CanvasItem } from '../types';

export const INITIAL_CANVAS_ITEMS: CanvasItem[] = [
  {
    id: 'item-navbar-1',
    type: 'navbar',
    title: 'Navbar Block',
    grid: { x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
    props: {
      brandName: 'HackForge',
      logoIcon: 'Sparkles',
      links: ['Features', 'AI Engine', 'Components', 'Pricing'],
      ctaText: 'Launch App',
      ctaVariant: 'indigo',
      showSearch: true,
      sticky: false,
    },
    createdAt: Date.now() - 5000,
  },
  {
    id: 'item-hero-1',
    type: 'hero',
    title: 'Hero Section',
    grid: { x: 0, y: 2, w: 12, h: 5, minW: 8, minH: 4 },
    props: {
      badge: '✨ Powered by Smart Grid AI & Gemini 3.6',
      title: 'Design & Build Modern Web Apps Without Code Limits',
      subtitle: 'Drag, resize, and compose intelligent UI components on a strict 12-column non-overlapping canvas with zero collisions.',
      primaryCta: 'Explore Canvas',
      secondaryCta: 'View Source Code',
      alignment: 'center',
      showGlow: true,
    },
    createdAt: Date.now() - 4000,
  },
  {
    id: 'item-heading-1',
    type: 'heading',
    title: 'Section Header',
    grid: { x: 0, y: 7, w: 6, h: 3, minW: 3, minH: 2 },
    props: {
      tag: 'H2',
      title: 'Smart Layout Engineering',
      subtitle: 'When components shift or expand, adjacent elements automatically step out of the way gracefully.',
      alignment: 'left',
      color: 'indigo',
      showDivider: true,
    },
    createdAt: Date.now() - 3000,
  },
  {
    id: 'item-ai-1',
    type: 'ai_container',
    title: 'AI Component Container',
    grid: { x: 6, y: 7, w: 6, h: 3, minW: 4, minH: 3 },
    props: {
      title: 'Real-Time AI Telemetry',
      statusText: 'Gemini Engine Active',
      metrics: [
        { label: 'Layout Density', value: '100%', change: 'Optimal', positive: true },
        { label: 'Collision Factor', value: '0.00', change: 'Zero Overlaps', positive: true },
        { label: 'Export Ready', value: 'JSX/TSX', change: 'Clean Code', positive: true },
      ],
      aiPromptUsed: '3-metric telemetry card with green success indicators',
      theme: 'glass',
    },
    createdAt: Date.now() - 2000,
  },
  {
    id: 'item-features-1',
    type: 'features',
    title: 'Feature Grid (3-Col)',
    grid: { x: 0, y: 10, w: 12, h: 4, minW: 8, minH: 3 },
    props: {
      sectionTitle: 'Why Organizers Choose HackForge',
      items: [
        { icon: 'Zap', title: 'Zero Overlaps Guarantee', desc: 'Smart vertical compaction algorithm automatically adjusts element positions.' },
        { icon: 'Bot', title: 'Generative AI Prompting', desc: 'Type what component you want to add, and Gemini generates it instantly.' },
        { icon: 'Code', title: '1-Click React Code Export', desc: 'Get clean, production-ready Tailwind CSS and React code for your layout.' },
      ],
    },
    createdAt: Date.now() - 1000,
  },
];
