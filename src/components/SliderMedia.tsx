import React, { useEffect, useRef, useState } from "react";

type Props = {
  video: string;
  poster: string;
  img1: string;
  img2: string;
  bgImage?: string; // color en HEX
  theme?: string; // color en HEX
  onVideoRef?(v: HTMLVideoElement | null): void;
};

export default function SliderMedia({
  video,
  poster,
  img1,
  img2,
  bgImage,
  theme,
  onVideoRef,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    onVideoRef?.(videoRef.current);
  }, [onVideoRef]);

  function go(i: number, animate = true) {
    const next = Math.max(0, Math.min(2, i));
    setIndex(next);
    const track = trackRef.current;
    if (!track) return;
    track.style.transitionDuration = animate ? "300ms" : "0ms";
    track.style.transform = `translateX(-${next * 100}%)`;
    // video play/pause
    const v = videoRef.current;
    if (v) next === 0 ? v.play().catch(() => {}) : v.pause();
  }

  // swipe
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
    };
    const move = (e: PointerEvent) => {
      if (!startX) return;
      dx = e.clientX - startX;
      track.style.transform = `translateX(calc(-${index * 100}% + ${dx}px))`;
    };
    const up = () => {
      track.style.transitionDuration = "300ms";
      const next = index + (Math.abs(dx) > 60 ? (dx < 0 ? 1 : -1) : 0);
      go(next);
      startX = 0;
      dx = 0;
    };
    track.addEventListener("pointerdown", down);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    return () => {
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
    };
  }, [index]);

  useEffect(() => {
    go(0, false);
  }, []); // inicial

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: theme }}
    >
      {/* Flechas */}
      <button
        aria-label="Previous"
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 hover:cursor-pointer"
        onClick={() => go(index - 1)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-6"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <button
        aria-label="Next"
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 hover:cursor-pointer"
        onClick={() => go(index + 1)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-6"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
        </svg>
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex h-full w-full select-none transition-transform duration-300 ease-out will-change-transform"
      >
        <div className="min-w-full shrink-0 aspect-[9/16]">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            loop
            preload="none"
            poster={poster}
            src={video}
          />
        </div>
        <div className="aspect-[9/16] min-w-full shrink-0 flex items-center justify-center">
          <img
            src={img1}
            alt="Media A"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
        <div
          className={`aspect-[9/16] min-w-full shrink-0 flex items-center justify-center bg-[${bgImage}]`}
          style={{ backgroundColor: bgImage }}
        >
          <img
            src={img2}
            alt="Media B"
            className="object-cover"
            loading="lazy"
          />
        </div>
      </div>

      {/* Dots */}
      <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 -translate-x-1/2 flex gap-2">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            className="inline-block size-2 rounded-full"
            style={{
              backgroundColor:
                i === index ? theme : "rgba(255,255,255)",
            }}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
