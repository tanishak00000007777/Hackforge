import { useEffect, useRef, useState } from 'react';
import ReactGridLayout from 'react-grid-layout/legacy';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../config/studio.js';
import { CanvasItemRenderer } from '../lovable-canvas/components/CanvasItemRenderer';
import type { CanvasBackground, CanvasItem } from '../lovable-canvas/types';
import '../lovable-canvas.css';

interface PublishedWebsite {
  hackathon_id: string;
  title: string;
  slug: string;
  project: {
    components?: CanvasItem[];
    globalTheme?: { canvasBackground?: CanvasBackground };
  };
}

export default function PublishedCanvasPage() {
  const { hackathonId, siteSlug } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState<PublishedWebsite | null>(null);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(1000);

  useEffect(() => {
    let cancelled = false;
    setSite(null);
    setError('');
    fetch(`${getApiBaseUrl()}/hackathons/public/${hackathonId}/website`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.detail || 'Published website not found');
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        if (body.slug && siteSlug !== body.slug) {
          navigate(`/sites/${body.hackathon_id || hackathonId}/${encodeURIComponent(body.slug)}`, { replace: true });
          return;
        }
        setSite(body);
        document.title = `${body.title} | HackForge`;
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });
    return () => { cancelled = true; };
  }, [hackathonId, navigate, siteSlug]);

  useEffect(() => {
    const previousTitle = document.title;
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const updateWidth = () => setCanvasWidth(Math.max(canvasRef.current!.clientWidth - 32, 320));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [site]);

  if (error) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-800"><p>{error}</p></main>;
  }
  if (!site) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-500"><p>Loading published website...</p></main>;
  }

  const items = Array.isArray(site.project?.components) ? site.project.components : [];
  const background = site.project?.globalTheme?.canvasBackground || 'dot';
  const backgroundClass = {
    blueprint: 'bg-sky-950 bg-grid-pattern-dark',
    clean: 'bg-white text-slate-900',
    dark: 'bg-slate-900 text-slate-100',
    dot: 'bg-slate-50 bg-grid-pattern text-slate-800',
  }[background];

  return (
    <div className="lovable-canvas-root">
      <main ref={canvasRef} className={`min-h-screen overflow-y-auto p-4 md:p-6 ${backgroundClass}`}>
        <ReactGridLayout
          className="layout min-h-[700px]"
          cols={12}
          rowHeight={70}
          width={canvasWidth}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          compactType="vertical"
          preventCollision={false}
          isDraggable={false}
          isResizable={false}
        >
          {items.map((item) => (
            <div key={item.id} data-grid={item.grid} className="relative rounded-2xl">
              <CanvasItemRenderer item={item} isPreviewMode />
            </div>
          ))}
        </ReactGridLayout>
      </main>
    </div>
  );
}
