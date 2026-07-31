import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactGridLayout, { LayoutItem } from 'react-grid-layout/legacy';
import {
  GripVertical,
  Trash2,
  Copy,
  Settings2,
  Eye,
  Plus,
  Sparkles
} from 'lucide-react';
import { CanvasItem, ComponentType, ViewportMode, CanvasBackground } from './types';
import { INITIAL_CANVAS_ITEMS } from './data/initialCanvas';
import { COMPONENT_TEMPLATES } from './data/componentTemplates';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CanvasItemRenderer } from './components/CanvasItemRenderer';
import { ComponentInspector } from './components/ComponentInspector';
import { CodeModal } from './components/CodeModal';
import { PublishModal } from './components/PublishModal';

interface StudioSession {
  hackathonId: string;
  accessToken: string;
  apiBaseUrl: string;
  onSessionExpired?: () => Promise<string | null>;
}

interface AppProps {
  session?: StudioSession;
}

const HOME_PAGE_ID = 'lovable-home';

const removeLegacyBranding = (items: CanvasItem[]) =>
  JSON.parse(
    JSON.stringify(items)
      .replace(/Lovable Canvas/gi, 'HackForge')
      .replace(/\bLovable\b/gi, 'HackForge')
      .replace(/\bGro(?:k|q)\b/gi, 'HackForge AI'),
  ) as CanvasItem[];

function websiteConfig(base: Record<string, any>, items: CanvasItem[], viewportMode: ViewportMode, canvasBg: CanvasBackground) {
  return {
    schemaVersion: 1,
    components: items,
    pages: [{ id: HOME_PAGE_ID, name: 'Home', path: '/', components: items }],
    currentPageId: HOME_PAGE_ID,
    globalTheme: { ...(base.globalTheme || {}), editor: 'lovable-canvas', canvasBackground: canvasBg },
    assets: Array.isArray(base.assets) ? base.assets : [],
    device: viewportMode,
    ...(base.banner_url ? { banner_url: base.banner_url } : {}),
    ...(base.logo_url ? { logo_url: base.logo_url } : {}),
  };
}

export default function App({ session }: AppProps) {
  const sessionHackathonId = session?.hackathonId;
  const sessionApiBaseUrl = session?.apiBaseUrl;
  // State
  const [items, setItems] = useState<CanvasItem[]>(INITIAL_CANVAS_ITEMS);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [canvasBg, setCanvasBg] = useState<CanvasBackground>('dot');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isHydrated, setIsHydrated] = useState(!session);
  const [siteSlug, setSiteSlug] = useState('my-hackathon');
  const [integrationError, setIntegrationError] = useState<string | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<CanvasItem[][]>([INITIAL_CANVAS_ITEMS]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Container width detection for react-grid-layout
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(1000);
  const baseConfigRef = useRef<Record<string, any>>({});
  const sessionRef = useRef(session);
  const hydratedRef = useRef(isHydrated);
  const mountedRef = useRef(true);
  const latestStateRef = useRef({ items, viewportMode, canvasBg });
  const savedStateRef = useRef({ items, viewportMode, canvasBg });
  const skipAutosaveRef = useRef(Boolean(session));
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const saveAgainRef = useRef(false);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const saveNowRef = useRef<(() => Promise<void>) | null>(null);
  sessionRef.current = session;
  hydratedRef.current = isHydrated;
  latestStateRef.current = { items, viewportMode, canvasBg };

  const hasUnsavedChanges = useCallback(() => {
    const latest = latestStateRef.current;
    const saved = savedStateRef.current;
    return latest.items !== saved.items || latest.viewportMode !== saved.viewportMode || latest.canvasBg !== saved.canvasBg;
  }, []);

  const apiRequest = useCallback(async (path: string, options: RequestInit = {}) => {
    const activeSession = sessionRef.current;
    if (!activeSession) throw new Error('Studio session is not connected');
    const request = (accessToken: string) => fetch(`${activeSession.apiBaseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    let response = await request(activeSession.accessToken);
    if (response.status === 401 && activeSession.onSessionExpired) {
      const refreshedToken = await activeSession.onSessionExpired();
      if (refreshedToken && refreshedToken !== activeSession.accessToken) {
        response = await request(refreshedToken);
      }
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || body.error || `Request failed (${response.status})`);
    return body;
  }, []);

  useEffect(() => {
    if (!sessionHackathonId || !sessionApiBaseUrl) return;
    let cancelled = false;
    setIsHydrated(false);
    setIntegrationError(null);
    baseConfigRef.current = {};
    revisionRef.current = 0;
    savedRevisionRef.current = 0;
    skipAutosaveRef.current = true;
    apiRequest(`/hackathons/manage/${sessionHackathonId}`)
      .then((hackathon) => {
        if (cancelled) return;
        const config = hackathon.website_config || {};
        const isLovableProject = config.globalTheme?.editor === 'lovable-canvas';
        const savedItems = isLovableProject && Array.isArray(config.components)
          ? removeLegacyBranding(config.components)
          : null;
        const nextItems = savedItems ?? INITIAL_CANVAS_ITEMS;
        const nextViewport = isLovableProject ? (config.device || 'desktop') : 'desktop';
        const nextCanvasBg = isLovableProject ? (config.globalTheme?.canvasBackground || 'dot') : 'dot';
        baseConfigRef.current = config;
        savedStateRef.current = { items: nextItems, viewportMode: nextViewport, canvasBg: nextCanvasBg };
        setSiteSlug(hackathon.slug || 'my-hackathon');
        setItems(nextItems);
        setHistory([nextItems]);
        setHistoryIndex(0);
        setSelectedItemId(null);
        setIsPreviewMode(false);
        setIsCodeModalOpen(false);
        setIsPublishModalOpen(false);
        setViewportMode(nextViewport);
        setCanvasBg(nextCanvasBg);
        skipAutosaveRef.current = true;
        setIntegrationError(null);
        setIsHydrated(true);
      })
      .catch((error) => {
        if (!cancelled) setIntegrationError(error.message);
      });
    return () => { cancelled = true; };
  }, [apiRequest, sessionApiBaseUrl, sessionHackathonId]);

  const saveNow = useCallback(() => {
    if (!sessionRef.current || !hydratedRef.current) return Promise.resolve();
    saveAgainRef.current = true;
    if (savePromiseRef.current) return savePromiseRef.current;

    const run = async () => {
      do {
        saveAgainRef.current = false;
        const activeSession = sessionRef.current;
        if (!activeSession) return;
        const revision = revisionRef.current;
        const snapshot = latestStateRef.current;
        const config = websiteConfig(baseConfigRef.current, snapshot.items, snapshot.viewportMode, snapshot.canvasBg);
        await apiRequest(`/hackathons/${activeSession.hackathonId}/website-config`, {
          method: 'PATCH',
          body: JSON.stringify(config),
        });
        baseConfigRef.current = config;
        savedStateRef.current = snapshot;
        savedRevisionRef.current = Math.max(savedRevisionRef.current, revision);
        if (mountedRef.current) setIntegrationError(null);
      } while (saveAgainRef.current || savedRevisionRef.current < revisionRef.current || hasUnsavedChanges());
    };

    savePromiseRef.current = run()
      .catch((error) => {
        if (mountedRef.current) setIntegrationError(error.message);
        throw error;
      })
      .finally(() => { savePromiseRef.current = null; });
    return savePromiseRef.current;
  }, [apiRequest, hasUnsavedChanges]);
  saveNowRef.current = saveNow;

  useEffect(() => {
    if (!sessionHackathonId || !isHydrated) return;
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }
    revisionRef.current += 1;
    const timeout = window.setTimeout(() => { saveNow().catch(() => {}); }, 1200);
    return () => window.clearTimeout(timeout);
  }, [items, viewportMode, canvasBg, isHydrated, saveNow, sessionHackathonId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      if (revisionRef.current > savedRevisionRef.current || hasUnsavedChanges()) {
        saveNowRef.current?.().catch(() => {});
      }
      mountedRef.current = false;
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const flushOnPageHide = () => {
      const activeSession = sessionRef.current;
      if (!activeSession || !hydratedRef.current || (revisionRef.current <= savedRevisionRef.current && !hasUnsavedChanges())) return;
      const snapshot = latestStateRef.current;
      const config = websiteConfig(baseConfigRef.current, snapshot.items, snapshot.viewportMode, snapshot.canvasBg);
      fetch(`${activeSession.apiBaseUrl}/hackathons/${activeSession.hackathonId}/website-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeSession.accessToken}`,
        },
        body: JSON.stringify(config),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('pagehide', flushOnPageHide);
    return () => window.removeEventListener('pagehide', flushOnPageHide);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const updateWidth = () => {
      if (canvasRef.current) {
        // Measure canvas width and subtract padding
        const width = canvasRef.current.clientWidth - 32;
        setCanvasWidth(Math.max(width, 320));
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(canvasRef.current);

    return () => observer.disconnect();
  }, [viewportMode, isPreviewMode]);

  // Push new state into history stack
  const pushHistory = (newItems: CanvasItem[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newItems);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setItems(history[prevIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setItems(history[nextIndex]);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) handleRedo();
        else handleUndo();
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRedo, handleUndo]);

  // Grid layout changes (dragging or resizing)
  const handleLayoutChange = (newLayout: LayoutItem[]) => {
    let changed = false;
    const updatedItems = items.map((item) => {
      const layoutItem = newLayout.find((l) => l.i === item.id);
      if (layoutItem) {
        if (
          item.grid.x !== layoutItem.x ||
          item.grid.y !== layoutItem.y ||
          item.grid.w !== layoutItem.w ||
          item.grid.h !== layoutItem.h
        ) {
          changed = true;
          return {
            ...item,
            grid: {
              ...item.grid,
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            },
          };
        }
      }
      return item;
    });

    if (changed) {
      setItems(updatedItems);
      pushHistory(updatedItems);
    }
  };

  // Add component from library
  const handleAddItem = (type: ComponentType) => {
    const template = COMPONENT_TEMPLATES.find((t) => t.type === type);
    if (!template) return;

    // Calculate y position below lowest current element
    const maxY = items.reduce((max, item) => Math.max(max, item.grid.y + item.grid.h), 0);

    const newItem: CanvasItem = {
      id: `item-${type}-${Date.now()}`,
      type,
      title: template.title,
      grid: {
        x: 0,
        y: maxY,
        w: template.defaultGrid.w,
        h: template.defaultGrid.h,
        minW: template.defaultGrid.minW || 2,
        minH: template.defaultGrid.minH || 2,
      },
      props: { ...template.defaultProps },
      createdAt: Date.now(),
    };

    const updated = [...items, newItem];
    setItems(updated);
    pushHistory(updated);
    setSelectedItemId(newItem.id);
  };

  // Duplicate component
  const handleDuplicateItem = (id: string) => {
    const itemToDup = items.find((i) => i.id === id);
    if (!itemToDup) return;

    const maxY = items.reduce((max, i) => Math.max(max, i.grid.y + i.grid.h), 0);

    const duplicated: CanvasItem = {
      ...itemToDup,
      id: `item-${itemToDup.type}-${Date.now()}`,
      title: `${itemToDup.title} (Copy)`,
      grid: {
        ...itemToDup.grid,
        y: maxY,
      },
      createdAt: Date.now(),
    };

    const updated = [...items, duplicated];
    setItems(updated);
    pushHistory(updated);
    setSelectedItemId(duplicated.id);
  };

  // Delete component
  const handleDeleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    pushHistory(updated);
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  // Update component props
  const handleUpdateProps = (id: string, newProps: Record<string, any>) => {
    const updated = items.map((i) => (i.id === id ? { ...i, props: newProps } : i));
    setItems(updated);
    pushHistory(updated);
  };

  // AI Generation from prompt (Full Website or Single Section)
  const handleGenerateAIComponent = async (prompt: string, replaceCanvas: boolean = false) => {
    setIsGeneratingAI(true);
    try {
      const json = session
        ? await apiRequest('/ai/canvas-generate', {
            method: 'POST',
            body: JSON.stringify({ prompt, isFullWebsite: true, hackathon_id: session.hackathonId }),
          })
        : await fetch('/api/generate-component', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, isFullWebsite: true }),
          }).then(async (response) => {
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || 'AI generation failed');
            return body;
          });
      const rawData = json.data || json.fallback;

      if (rawData) {
        // Extract array of components or single component object
        const rawComponents: any[] = Array.isArray(rawData)
          ? rawData
          : rawData.components && Array.isArray(rawData.components)
          ? rawData.components
          : [rawData];

        let baseItems = replaceCanvas ? [] : items;
        let currentY = replaceCanvas ? 0 : baseItems.reduce((max, i) => Math.max(max, i.grid.y + i.grid.h), 0);
        const newItems: CanvasItem[] = [];

        for (let idx = 0; idx < rawComponents.length; idx++) {
          const comp = rawComponents[idx];
          const itemWidth = comp.suggestedGrid?.w || 12;
          const itemHeight = comp.suggestedGrid?.h || (
            comp.type === 'hero' ? 6 :
            comp.type === 'navbar' ? 2 :
            comp.type === 'pricing' ? 6 :
            comp.type === 'features' ? 5 : 4
          );

          newItems.push({
            id: `item-ai-${Date.now()}-${idx}`,
            type: comp.type || 'ai_container',
            title: comp.title || 'AI Component',
            grid: {
              x: 0,
              y: currentY,
              w: itemWidth,
              h: itemHeight,
              minW: 3,
              minH: 2,
            },
            props: comp.props || {},
            createdAt: Date.now() + idx,
          });

          currentY += itemHeight;
        }

        const updated = [...baseItems, ...newItems];
        setItems(updated);
        pushHistory(updated);
        if (newItems.length > 0) {
          setSelectedItemId(newItems[0].id);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI generation failed';
      setIntegrationError(message);
      console.error('Failed to generate AI website:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // AI Polish / Refine single item
  const handleRefineWithAI = async (id: string, instructions: string) => {
    const targetItem = items.find((i) => i.id === id);
    if (!targetItem) return;

    try {
      const request = {
        prompt: `Refine existing ${targetItem.type} component named "${targetItem.title}". Instruction: ${instructions}`,
        isFullWebsite: false,
        hackathon_id: session?.hackathonId,
      };
      const json = session
        ? await apiRequest('/ai/canvas-generate', { method: 'POST', body: JSON.stringify(request) })
        : await fetch('/api/generate-component', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          }).then(async (response) => {
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || 'AI refinement failed');
            return body;
          });
      const raw = json.data || json.fallback;
      const candidates = Array.isArray(raw) ? raw : (Array.isArray(raw?.components) ? raw.components : [raw]);
      const data = candidates.find((component: any) => component?.type === targetItem.type);

      if (data && data.props) {
        handleUpdateProps(id, { ...targetItem.props, ...data.props });
      } else {
        throw new Error('AI did not return a compatible component refinement.');
      }
    } catch (err) {
      setIntegrationError(err instanceof Error ? err.message : 'AI refinement failed');
      console.error('Failed to refine component with AI:', err);
    }
  };

  const handlePublish = async (slug: string) => {
    if (!session) throw new Error('Studio session is not connected');
    if (!isHydrated) throw new Error('Wait for the canvas to finish loading before publishing.');
    await saveNow();
    const published = await apiRequest(`/hackathons/${session.hackathonId}/publish`, { method: 'POST' });
    const canonicalSlug = published.slug || siteSlug || slug;
    return `${window.location.origin}/sites/${session.hackathonId}/${encodeURIComponent(canonicalSlug)}`;
  };

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  // Viewport width styling
  const getViewportContainerStyle = () => {
    if (viewportMode === 'tablet') return 'max-w-[768px] mx-auto';
    if (viewportMode === 'mobile') return 'max-w-[390px] mx-auto';
    return 'w-full';
  };

  // Background pattern class
  const getCanvasBgClass = () => {
    switch (canvasBg) {
      case 'blueprint': return 'bg-sky-950 bg-grid-pattern-dark';
      case 'clean': return 'bg-white text-slate-900';
      case 'dark': return 'bg-slate-900 text-slate-100';
      default: return 'bg-slate-50 bg-grid-pattern text-slate-800';
    }
  };

  return (
    <div id="lovable-canvas-app" className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <Header
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenCode={() => setIsCodeModalOpen(true)}
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        viewportMode={viewportMode}
        onViewportChange={setViewportMode}
        itemCount={items.length}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        {!isPreviewMode && (
          <Sidebar
            onAddItem={handleAddItem}
            items={items}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            onDeleteItem={handleDeleteItem}
            onDuplicateItem={handleDuplicateItem}
            canvasBg={canvasBg}
            onChangeCanvasBg={setCanvasBg}
            onGenerateAIComponent={handleGenerateAIComponent}
            isGeneratingAI={isGeneratingAI}
          />
        )}

        {/* Center Smart Grid Canvas Workspace */}
        <main
          ref={canvasRef}
          className={`flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300 ${getCanvasBgClass()} custom-scrollbar relative`}
          onClick={() => setSelectedItemId(null)}
        >
          {/* Viewport Frame Box */}
          <div className={`${getViewportContainerStyle()} transition-all duration-300 min-h-[calc(100vh-8rem)] pb-24 relative`}>

            {/* Live Preview Mode Badge */}
            {isPreviewMode && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Live Preview Mode Active</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">Drag handles and grid controls hidden</span>
                </div>
                <button
                  onClick={() => setIsPreviewMode(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors shadow-xs"
                >
                  Return to Edit Canvas
                </button>
              </div>
            )}

            {/* Empty Canvas Indicator */}
            {items.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-white/80 my-12 max-w-md mx-auto space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Your Canvas is Empty</h3>
                  <p className="text-xs text-slate-500 mt-1">Select components from the left sidebar or ask AI to generate one.</p>
                </div>
                <button
                  onClick={() => handleAddItem('hero')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-indigo-100 transition-all"
                >
                  + Add Hero Section
                </button>
              </div>
            )}

            {/* Smart 12-Column Non-Overlapping Grid Layout */}
            <ReactGridLayout
              className="layout min-h-[700px]"
              cols={12}
              rowHeight={70}
              width={canvasWidth}
              margin={[16, 16]}
              containerPadding={[0, 0]}
              compactType="vertical"
              preventCollision={false}
              isDraggable={!isPreviewMode}
              isResizable={!isPreviewMode}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              resizeHandles={['se']}
            >
              {items.map((item) => {
                const isSelected = selectedItemId === item.id;

                return (
                  <div
                    key={item.id}
                    data-grid={{
                      x: item.grid.x,
                      y: item.grid.y,
                      w: item.grid.w,
                      h: item.grid.h,
                      minW: item.grid.minW || 2,
                      minH: item.grid.minH || 2,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPreviewMode) setSelectedItemId(item.id);
                    }}
                    className={`group relative rounded-2xl transition-shadow duration-200 ${
                      !isPreviewMode && isSelected
                        ? 'ring-2 ring-indigo-500 shadow-xl shadow-indigo-100 z-30'
                        : !isPreviewMode
                        ? 'hover:ring-1 hover:ring-indigo-400/60 z-10'
                        : ''
                    }`}
                  >
                    {/* Bounding Hover Control Bar (Hidden in Live Preview) */}
                    {!isPreviewMode && (
                      <div className="absolute -top-9 left-0 right-0 h-8 px-3 bg-white/95 border border-slate-200 rounded-t-xl flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-40 text-xs shadow-md backdrop-blur-md">
                        {/* Drag Handle */}
                        <div className="drag-handle flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-slate-600 hover:text-indigo-600 font-semibold truncate mr-2">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({item.grid.w}x{item.grid.h})</span>
                        </div>

                        {/* Quick Action Toolbar */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemId(item.id);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"
                            title="Edit Component Props"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateItem(item.id);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                            className="p-1 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600"
                            title="Delete Component"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Component Visual Render */}
                    <CanvasItemRenderer item={item} isPreviewMode={isPreviewMode} />
                  </div>
                );
              })}
            </ReactGridLayout>
          </div>
        </main>

        {/* Right Inspector Panel */}
        {!isPreviewMode && selectedItem && (
          <ComponentInspector
            item={selectedItem}
            onClose={() => setSelectedItemId(null)}
            onUpdateProps={handleUpdateProps}
            onDeleteItem={handleDeleteItem}
            onDuplicateItem={handleDuplicateItem}
            onRefineWithAI={handleRefineWithAI}
          />
        )}
      </div>

      {/* Code Export Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        items={items}
      />

      {/* Publish & Export Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        itemCount={items.length}
        initialSlug={siteSlug}
        onPublish={session ? handlePublish : undefined}
      />

      {integrationError && isHydrated && (
        <div role="alert" className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-xl border border-rose-200 bg-white px-4 py-3 text-xs font-medium text-rose-700 shadow-xl">
          {integrationError}
        </div>
      )}

      {!isHydrated && session && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-100/95 p-6 backdrop-blur-sm">
          <div className="max-w-sm text-center text-slate-700">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-indigo-600" />
            <p className="text-sm font-bold">{integrationError ? 'Unable to open this canvas' : 'Opening your canvas...'}</p>
            <p className="mt-1 text-xs text-slate-500">{integrationError || 'Loading the latest saved workspace.'}</p>
            {integrationError && (
              <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                Try again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
