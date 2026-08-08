import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export type WebGLBoundaryStatus = 'ready' | 'unsupported' | 'lost';

export interface WebGLBoundaryRenderApi {
  readonly generation: number;
}

interface WebGLBoundaryProps {
  readonly children: (api: WebGLBoundaryRenderApi) => ReactNode;
  readonly sceneLabel: string;
  readonly stageAttributes?: WebGLStageAttributes;
}

type WebGLStageAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  'aria-label' | 'children' | 'role'
> & {
  readonly [key: `data-${string}`]: string | number | boolean | undefined;
};

/** Test WebGL2 without accepting WebGL1 as an implicit renderer fallback. */
export function supportsWebGL2(): boolean {
  if (typeof document === 'undefined' || typeof WebGL2RenderingContext === 'undefined') {
    return false;
  }
  try {
    return document.createElement('canvas').getContext('webgl2') instanceof WebGL2RenderingContext;
  } catch {
    return false;
  }
}

/**
 * Own WebGL capability, context-loss, and runtime-error semantics around the
 * snapshot renderer without receiving any game command authority.
 */
export function WebGLBoundary({
  children,
  sceneLabel,
  stageAttributes,
}: WebGLBoundaryProps): React.JSX.Element {
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState<WebGLBoundaryStatus>(() =>
    supportsWebGL2() ? 'ready' : 'unsupported',
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const registeredCanvas = useRef<HTMLCanvasElement | null>(null);

  const handleContextLost = useCallback((event: Event): void => {
    event.preventDefault();
    setStatus('lost');
  }, []);
  const handleContextRestored = useCallback((): void => setStatus('ready'), []);
  const retry = useCallback((): void => {
    if (!supportsWebGL2()) {
      setStatus('unsupported');
      return;
    }
    setGeneration((current) => current + 1);
    setStatus('ready');
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || status === 'unsupported') return undefined;
    const detach = (): void => {
      registeredCanvas.current?.removeEventListener('webglcontextlost', handleContextLost);
      registeredCanvas.current?.removeEventListener('webglcontextrestored', handleContextRestored);
      registeredCanvas.current = null;
    };
    const attach = (): void => {
      const canvas = stage.querySelector('canvas');
      if (canvas === registeredCanvas.current) return;
      detach();
      registeredCanvas.current = canvas;
      canvas?.addEventListener('webglcontextlost', handleContextLost);
      canvas?.addEventListener('webglcontextrestored', handleContextRestored);
    };
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(stage, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      detach();
    };
  }, [generation, handleContextLost, handleContextRestored, status]);

  const stage = (
    <div
      {...stageAttributes}
      aria-label={sceneLabel}
      className="webgl-stage"
      data-webgl-status={status}
      ref={stageRef}
      role="img"
    >
      {status === 'ready' || status === 'lost' ? children({ generation }) : null}
      {status === 'unsupported' ? (
        <div aria-hidden="true" className="webgl-static-backdrop">
          <span>LANEWAY 3D</span>
        </div>
      ) : null}
      {status === 'lost' ? <div aria-hidden="true" className="webgl-context-overlay" /> : null}
    </div>
  );

  return (
    <RuntimeErrorBoundary key={generation} onRetry={retry} sceneLabel={sceneLabel}>
      {stage}
      {status === 'unsupported' ? <RecoveryMessage kind="unsupported" onRetry={retry} /> : null}
      {status === 'lost' ? <RecoveryMessage kind="lost" onRetry={retry} /> : null}
    </RuntimeErrorBoundary>
  );
}

function RecoveryMessage({
  kind,
  onRetry,
}: {
  readonly kind: 'unsupported' | 'lost';
  readonly onRetry: () => void;
}): React.JSX.Element {
  const unsupported = kind === 'unsupported';
  return (
    <section className="webgl-recovery" role="alert">
      <strong>{unsupported ? '3D service needs WebGL 2' : 'The 3D context was interrupted'}</strong>
      <p>
        {unsupported
          ? 'This browser cannot open the required 3D service view. Your campaign remains autosaved; pause with the service controls below before retrying or reloading.'
          : 'Simulation truth and autosave are unchanged. Retry the renderer, or pause with the service controls below before reloading the saved game.'}
      </p>
      <div className="webgl-recovery-actions">
        <button className="button" onClick={onRetry} type="button">
          Retry 3D scene
        </button>
        <button className="button-secondary" onClick={() => window.location.reload()} type="button">
          Reload saved game
        </button>
      </div>
    </section>
  );
}

interface RuntimeErrorBoundaryProps {
  readonly children: ReactNode;
  readonly onRetry: () => void;
  readonly sceneLabel: string;
}

interface RuntimeErrorBoundaryState {
  readonly failed: boolean;
}

class RuntimeErrorBoundary extends Component<RuntimeErrorBoundaryProps, RuntimeErrorBoundaryState> {
  public override state: RuntimeErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): RuntimeErrorBoundaryState {
    return { failed: true };
  }

  public override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <section aria-label={this.props.sceneLabel} className="webgl-recovery" role="alert">
        <strong>The 3D renderer could not start</strong>
        <p>
          Your simulation and autosave are still intact. Retry the renderer, or pause service before
          reloading this saved game.
        </p>
        <div className="webgl-recovery-actions">
          <button className="button" onClick={this.props.onRetry} type="button">
            Retry 3D scene
          </button>
          <button
            className="button-secondary"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload saved game
          </button>
        </div>
      </section>
    );
  }
}
