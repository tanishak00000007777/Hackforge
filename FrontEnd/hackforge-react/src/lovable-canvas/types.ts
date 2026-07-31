export type ComponentType =
  | 'heading'
  | 'button'
  | 'image_card'
  | 'navbar'
  | 'hero'
  | 'ai_container'
  | 'pricing'
  | 'features'
  | 'stats'
  | 'testimonials'
  | 'contact'
  | 'faq';

export interface GridPos {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface CanvasItem {
  id: string;
  type: ComponentType;
  title: string;
  grid: GridPos;
  props: Record<string, any>;
  createdAt?: number;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export type ThemePreset = 'indigo' | 'emerald' | 'violet' | 'amber' | 'slate';

export type CanvasBackground = 'dot' | 'blueprint' | 'clean' | 'dark';

export interface ComponentTemplate {
  type: ComponentType;
  title: string;
  description: string;
  iconName: string;
  defaultGrid: { w: number; h: number; minW?: number; minH?: number };
  defaultProps: Record<string, any>;
  category: 'core' | 'sections' | 'ai';
}
