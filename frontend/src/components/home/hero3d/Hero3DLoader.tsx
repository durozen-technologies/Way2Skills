
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

function SceneFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative aspect-square w-[62%] max-w-[420px]">
        <div className="absolute inset-0 rounded-full bg-sky-300/25 blur-2xl motion-safe:animate-pulse" />
        <div className="absolute inset-[8%] rounded-full border border-sky-400/50 bg-gradient-to-br from-sky-200/40 to-cyan-300/10" />
        <div className="absolute inset-[22%] rounded-full border border-cyan-300/40" />
        <div className="absolute bottom-[6%] left-1/2 h-4 w-[55%] -translate-x-1/2 rounded-full bg-slate-900/30 blur-md" />
      </div>
    </div>
  );
}

const Hero3DScene = dynamic(() => import("./Hero3DScene"), {
  ssr: false,
});

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl");

    if (!gl) return false;

    const loseContext = gl.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();

    return true;
  } catch {
    return false;
  }
}

export default function Hero3DLoader({
  className = "",
}: {
  className?: string;
}) {
  const wrapper = useRef<HTMLDivElement>(null);

  const [shouldMount, setShouldMount] = useState(false);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    setWebgl(hasWebGL());

    const element = wrapper.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;

        setInView(visible);

        if (visible) {
          setShouldMount(true);
        }
      },
      {
        rootMargin: "80px",
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      setPageVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", updateVisibility);

    return () =>
      document.removeEventListener(
        "visibilitychange",
        updateVisibility
      );
  }, []);

  const active = inView && pageVisible;

  return (
    <div
      ref={wrapper}
      aria-hidden="true"
      className={`pointer-events-none relative h-full w-full ${className}`}
    >
      {!ready && (
        <div className="absolute inset-0">
          <SceneFallback />
        </div>
      )}

      {shouldMount && webgl && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
          <Hero3DScene
            active={active}
            onReady={() => setReady(true)}
          />
        </div>
      )}
    </div>
  );
}
