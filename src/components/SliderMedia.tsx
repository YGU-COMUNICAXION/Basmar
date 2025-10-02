import React, { useEffect, useRef, useState } from "react";

type Props = {
  video: string;
  poster: string;
  img1: string;
  img2: string;
  bgImage?: string;
  theme?: string;
  onVideoRef?(v: HTMLVideoElement | null): void;

  // Para convivir con tu sheet (los sigo respetando)
  controlsOffset?: number; // px desde bottom para dots
  visibleHeight?: number; // px para centrar flechas
  visibleKey?: string | number; // cambia cuando el modal se vuelve visible
};

export default function SliderMedia({
  video,
  poster,
  img1,
  img2,
  bgImage,
  theme,
  onVideoRef,
  controlsOffset = 12,
  visibleHeight,
  visibleKey,
}: Props) {
  const SLIDES = 3;
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [index, setIndex] = useState(0);
  const slideWRef = useRef(0); // ancho del slide (= ancho del root)

  useEffect(() => {
    onVideoRef?.(videoRef.current);
  }, [onVideoRef]);

  /** Alinea el track al slide actual usando el ancho medido */
  const align = (animate = false) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transitionDuration = animate ? "300ms" : "0ms";
    track.style.transform = `translateX(-${index * slideWRef.current}px)`;
  };

  /** Mide el ancho del root; si está oculto (0px), reintenta unos frames */
  const measureAfterVisible = () => {
    let tries = 0;
    const maxTries = 12;
    const loop = () => {
      const rw = rootRef.current?.getBoundingClientRect().width ?? 0;
      if (rw > 0) {
        slideWRef.current = rw;
        align(false);
        return;
      }
      if (tries++ < maxTries) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  // Medición en montaje + resize/orientation
  useEffect(() => {
    measureAfterVisible();
    const ro = new ResizeObserver(() => {
      const rw = rootRef.current?.getBoundingClientRect().width ?? 0;
      if (rw > 0) {
        slideWRef.current = rw;
        align(false);
      }
    });
    if (rootRef.current) ro.observe(rootRef.current);

    const onWinResize = () => {
      const rw = rootRef.current?.getBoundingClientRect().width ?? 0;
      if (rw > 0) {
        slideWRef.current = rw;
        align(false);
      }
    };
    window.addEventListener("resize", onWinResize);
    window.addEventListener("orientationchange", onWinResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("orientationchange", onWinResize);
    };
  }, []);

  // Re-medimos cuando el modal pasa a visible (clave cambia)
  useEffect(() => {
    measureAfterVisible();
  }, [visibleKey]);

  function go(i: number, animate = true) {
    const next = Math.max(0, Math.min(SLIDES - 1, i));
    setIndex(next);
    const track = trackRef.current;
    if (!track) return;
    track.style.transitionDuration = animate ? "300ms" : "0ms";
    track.style.transform = `translateX(-${next * slideWRef.current}px)`;
    const v = videoRef.current;
    if (v) next === 0 ? v.play().catch(() => {}) : v.pause();
  }

  // Swipe horizontal en píxeles
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let startX = 0,
      dx = 0,
      pid = 0;

    const down = (e: PointerEvent) => {
      startX = e.clientX;
      dx = 0;
      pid = e.pointerId;
      track.setPointerCapture(pid);
      track.style.transitionDuration = "0ms";
      (track as HTMLElement).style.touchAction = "pan-y";
    };
    const move = (e: PointerEvent) => {
      if (!startX) return;
      dx = e.clientX - startX;
      track.style.transform = `translateX(${
        -(index * slideWRef.current) + dx
      }px)`;
    };
    const up = () => {
      track.style.transitionDuration = "300ms";
      const threshold = Math.min(60, slideWRef.current * 0.15);
      const next = index + (Math.abs(dx) > threshold ? (dx < 0 ? 1 : -1) : 0);
      go(next);
      startX = 0;
      dx = 0;
    };

    track.addEventListener("pointerdown", down);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
    return () => {
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
      track.removeEventListener("pointercancel", up);
    };
  }, [index]);

  const arrowStyle =
    typeof visibleHeight === "number"
      ? { top: `${visibleHeight / 2}px`, transform: "translateY(-50%)" }
      : { top: "50%", transform: "translateY(-50%)" };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: theme }}
    >
      {/* Flechas */}
      <button
        aria-label="Previous"
        className="absolute left-2 z-10 rounded-full p-3 hover:cursor-pointer"
        style={arrowStyle}
        onClick={() => go(index - 1)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-6"
          viewBox="0 0 24 24"
          fill="#fff"
        >
          <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <button
        aria-label="Next"
        className="absolute right-2 z-10 rounded-full p-3 hover:cursor-pointer"
        style={arrowStyle}
        onClick={() => go(index + 1)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-6"
          viewBox="0 0 24 24"
          fill="#fff"
        >
          <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
        </svg>
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex h-full w-full select-none transition-transform duration-300 ease-out will-change-transform"
      >
        {/* Slide 1: VIDEO - 100% del contenedor, centrado con object-cover */}
        <div className="basis-full flex-none h-full relative overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted
            loop
            preload="none"
            poster={poster}
            src={video}
          />
        </div>

        {/* Slide 2: IMG COVER - 100% contenedor, centrado */}
        <div className="basis-full flex-none h-full relative overflow-hidden">
          <img
            src={img1}
            alt="Media A"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        </div>

        {/* Slide 3: IMG CONTAIN - centrada y NO llena el slide */}
        <div
          className="basis-full flex-none h-full flex items-center justify-center"
          style={{ backgroundColor: bgImage }}
        >
          <img
            src={img2}
            alt="Media B"
            className="max-h-[90%] max-w-[85%] object-contain"
            loading="lazy"
          />
        </div>
      </div>

      {/* Dots */}
      <div
        className="pointer-events-auto absolute left-1/2 z-10 -translate-x-1/2 flex gap-2"
        style={{ bottom: `${controlsOffset}px` }}
      >
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            className="inline-block size-2 rounded-full"
            style={{
              backgroundColor: i === index ? theme : "rgba(255,255,255)",
              opacity: i === index ? 1 : 0.8,
            }}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
