// ... imports y tipos como ya los tienes
import { useEffect, useMemo, useRef, useState } from "react";
import SliderMedia from "./SliderMedia";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function TextPanel({ m }: { m: Perfume["modal"] }) {
  return (
    <>
      <h2 className="font-desert text-2xl tracking-wide md:text-4xl lg:text-5xl">
        {m.title}
      </h2>
      <p className="mb-3 text-sm lg:text-base">{m.retailers}</p>
      <p className="mb-3 font-desert text-base uppercase lg:text-lg xl:text-xl">
        {m.categories}
      </p>
      <p className="mb-3 text-base lg:text-lg xl:text-xl">SIZE: {m.size}</p>

      <h3 className="mb-4 text-base lg:text-lg xl:text-2xl">FRAGRANCE NOTES</h3>
      <p className="text-base lg:text-lg xl:text-xl">
        <span className="font-desert font-bold tracking-widest">TOP:</span>{" "}
        {m.notesTop}
      </p>
      <p className="text-base lg:text-lg xl:text-xl">
        <span className="font-desert font-bold tracking-widest">HEART:</span>{" "}
        {m.notesHeart}
      </p>
      <p className="text-base lg:text-lg xl:text-xl">
        <span className="font-desert font-bold tracking-widest">BASE:</span>{" "}
        {m.notesBase}
      </p>

      <h3 className="mt-8 font-desert text-lg tracking-wide lg:text-xl xl:text-2xl">
        DESCRIPTION
      </h3>
      <p className="mt-2 text-sm leading-relaxed lg:text-base xl:text-lg 2xl:text-xl">
        {m.description}
      </p>

      <p className="mt-3 text-center text-sm italic opacity-80 xl:absolute xl:bottom-4 xl:left-1/2 xl:w-4/5 xl:-translate-x-1/2 xl:mt-0 lg:text-base">
        Extrait de Parfum – <b>20%+</b> fragrance oil concentration for richness
        and longer-lasting wear.
      </p>
    </>
  );
}

type Props = {
  containerId: string;
  items: Perfume[];
  collapsedPercent?: number; // controla altura del sheet colapsado
};

export default function ModalProduct({
  containerId,
  items,
  collapsedPercent = 70,
}: Props) {
  const [openId, setOpenId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sheet (mobile)
  const COLLAPSED = clamp(collapsedPercent, 0, 85);
  const [sheetY, setSheetY] = useState<number>(COLLAPSED);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const startSheetRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Offsets para el slider
  const [controlsOffset, setControlsOffset] = useState(12);
  const [visibleHeight, setVisibleHeight] = useState<number | undefined>(
    undefined
  );

  const recalcOffsets = () => {
    const el = sheetRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const overlap = Math.max(0, vh - rect.top); // lo que tapa el sheet
    const visible = Math.max(120, vh - overlap); // alto visible del carrusel
    setControlsOffset(Math.max(12, overlap + 12)); // dots por encima del sheet
    setVisibleHeight(visible); // flechas centradas en área visible
  };

  const map = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  );
  const item = openId ? map[openId] : undefined;

  // Observa cambios en data-open
  useEffect(() => {
    const host = document.getElementById(containerId);
    if (!host) return;
    const apply = () => {
      const id = host.getAttribute("data-open") || "";
      setOpenId(id);
      document.body.classList.toggle("no-scroll", !!id);
      if (id) setSheetY(COLLAPSED);
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(host, {
      attributes: true,
      attributeFilter: ["data-open", "class"],
    });
    return () => mo.disconnect();
  }, [containerId, COLLAPSED]);

  // Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openId) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  // Recalcula offsets según la posición del sheet (mobile)
  useEffect(() => {
    const recalc = () => {
      const el = sheetRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const overlap = Math.max(0, vh - rect.top); // cuánto tapa el sheet
      const visible = Math.max(120, vh - overlap); // alto visible del carrusel
      setControlsOffset(Math.max(12, overlap + 12)); // dots por encima del sheet
      setVisibleHeight(visible); // centra flechas en área visible
    };
    recalc();
    window.addEventListener("resize", recalc);
    const t = setTimeout(recalc, 0);
    return () => {
      window.removeEventListener("resize", recalc);
      clearTimeout(t);
    };
  }, [sheetY, openId]);

  // recalcula al abrir/cerrar y al cambiar el destino del sheet
  useEffect(() => {
    if (dragging) return; // <- evita recálculo continuo durante el drag
    recalcOffsets();
    const onResize = () => recalcOffsets();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [openId, sheetY, dragging]);

  // asegura recálculo al FINAL de la transición (rebote incluido)
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const onEnd = (ev: TransitionEvent) => {
      if (ev.propertyName === "transform") {
        // espera un frame para que termine el layout
        requestAnimationFrame(recalcOffsets);
      }
    };
    el.addEventListener("transitionend", onEnd);
    return () => el.removeEventListener("transitionend", onEnd);
  }, [openId]);

  // al soltar, fija el destino y programa un recálculo
  const onPointerUpSheet = () => {
    if (!dragging) return;
    setDragging(false);
    setSheetY((prev) => (prev > 30 ? COLLAPSED : 0));
    // recalc inmediato (posición donde soltaste)...
    recalcOffsets();
    // ...y al final de la animación se vuelve a llamar por transitionend
  };

  // Pausar/Reanudar video según sheet
  useEffect(() => {
    if (!videoRef.current) return;
    if (sheetY <= 5) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  }, [sheetY]);

  function close() {
    const host = document.getElementById(containerId);
    if (!host) return;
    host.classList.add("hidden");
    host.setAttribute("data-open", "");
    document.body.classList.remove("no-scroll");
    videoRef.current?.pause?.();
  }

  function handleVideoRef(v: HTMLVideoElement | null) {
    videoRef.current = v;
    if (v && openId) v.play().catch(() => {});
  }

  if (!item) return null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Product details"
      className="container mx-auto flex h-full items-center px-4"
    >
      <div className="relative mx-auto flex h-[min(90vh,900px)] w-full max-w-screen-2xl flex-col overflow-hidden rounded-none md:shadow-2xl">
        {/* Close */}
        <button
          aria-label="Close"
          className="absolute right-3 top-3 z-30 rounded-full p-2 hover:cursor-pointer md:right-4 md:top-4"
          onClick={close}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-8 fill-amber-50 lg:fill-dark-purple"
            viewBox="0 0 24 24"
          >
            <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
          </svg>
        </button>

        {/* MOBILE */}
        <div className="relative h-full w-full md:hidden">
          <div className="absolute inset-0">
            <SliderMedia
              video={item.modal.video}
              poster={item.card.thumb.src}
              img1={item.modal.img1.src}
              img2={item.modal.img2.src}
              bgImage={item.modal.bgImage}
              theme={item.modal.theme}
              onVideoRef={(v) => {
                videoRef.current = v;
                if (sheetY > 5) v?.play?.().catch(() => {});
              }}
              controlsOffset={controlsOffset}
              visibleHeight={visibleHeight}
              visibleKey={openId}
            />
          </div>

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl text-dark-purple"
            style={{
              transform: `translateY(${sheetY}%)`,
              transition: dragging ? "none" : "transform 280ms ease",
              backgroundColor: item.modal.theme,
            }}
            aria-expanded={sheetY <= 5}
            onPointerUp={onPointerUpSheet}
          >
            <div
              className="flex cursor-grab touch-none select-none items-center justify-center py-2 active:cursor-grabbing"
              onPointerDown={(e) => {
                setDragging(true);
                startYRef.current = e.clientY;
                startSheetRef.current = sheetY;
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!dragging) return;
                const dy = e.clientY - startYRef.current;
                const vh = Math.max(window.innerHeight, 1);
                const deltaPct = (dy / vh) * 100;
                setSheetY(clamp(startSheetRef.current + deltaPct, 0, 85));
              }}
              onPointerUp={() => {
                if (!dragging) return;
                setDragging(false);
                setSheetY((prev) => (prev > 30 ? COLLAPSED : 0));
              }}
            >
              <span className="h-1.5 w-10 rounded-full bg-dark-purple/80" />
            </div>

            <div className="max-h-[70svh] overflow-y-auto px-5 pb-6">
              <TextPanel m={item.modal} />
            </div>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden h-full w-full md:grid md:grid-cols-2 md:grid-rows-1">
          <SliderMedia
            video={item.modal.video}
            poster={item.card.thumb.src}
            img1={item.modal.img1.src}
            img2={item.modal.img2.src}
            bgImage={item.modal.bgImage}
            theme={item.modal.theme}
            onVideoRef={handleVideoRef}
          />
          <div
            className="relative overflow-y-auto p-6 text-dark-purple md:p-10"
            style={{ backgroundColor: item.modal.theme }}
          >
            <TextPanel m={item.modal} />
          </div>
        </div>
      </div>
    </section>
  );
}
