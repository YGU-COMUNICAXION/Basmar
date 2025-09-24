import { useEffect, useMemo, useRef, useState } from "react";
import SliderMedia from "./SliderMedia";

interface Perfume {
  id: string;
  slug: string;
  card: {
    title: string;
    thumb: ImageMetadata;
    alt: string;
  };
  modal: {
    title: string;
    retailers: string;
    categories: string;
    size: string;
    notesTop: string;
    notesHeart: string;
    notesBase: string;
    description: string;
    video: string;
    poster: ImageMetadata;
    img1: ImageMetadata;
    img2: ImageMetadata;
    bgImage: string;
    theme: string;
  };
}

type Props = {
  containerId: string; // ej: "modal-for-her"
  items: Perfume[]; // ya con .src resuelto desde Astro
};

export default function ModalProduct({ containerId, items }: Props) {
  const [openId, setOpenId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const map = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  );
  const item = openId ? map[openId] : undefined;

  // Observa cambios en data-open del contenedor externo
  useEffect(() => {
    const host = document.getElementById(containerId);
    if (!host) return;
    const apply = () => {
      const id = host.getAttribute("data-open") || "";
      setOpenId(id);
      document.body.classList.toggle("no-scroll", !!id);
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(host, {
      attributes: true,
      attributeFilter: ["data-open", "class"],
    });
    return () => mo.disconnect();
  }, [containerId]);

  // Esc para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openId) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  function close() {
    const host = document.getElementById(containerId);
    if (!host) return;
    host.classList.add("hidden");
    host.setAttribute("data-open", "");
    document.body.classList.remove("no-scroll");
    videoRef.current?.pause?.();
  }

  // Conecta ref del video desde Slider
  function handleVideoRef(v: HTMLVideoElement | null) {
    videoRef.current = v;
    if (v && openId) v.play().catch(() => {});
  }

  if (!item) return null;

  return (
    // El overlay real es el contenedor externo; aquí solo el contenido
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Product details"
      className="container mx-auto flex h-full items-center px-4"
    >
      <div className="relative mx-auto flex h-[min(90vh,900px)] w-full max-w-screen-2xl flex-col overflow-hidden rounded-none md:shadow-2xl">
        {/* Cerrar */}
        <button
          aria-label="Close"
          className="absolute right-3 top-3 z-20 rounded-full p-2 md:right-4 md:top-4 hover:cursor-pointer"
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

        <div className="grid h-full grid-rows-[minmax(40%,360px)_1fr] md:grid-cols-2 md:grid-rows-1">
          {/* Media */}
          <SliderMedia
            video={item.modal.video}
            poster={item.card.thumb.src}
            img1={item.modal.img1.src}
            img2={item.modal.img2.src}
            bgImage={item.modal.bgImage}
            theme={item.modal.theme}
            onVideoRef={handleVideoRef}
          />

          {/* Panel */}
          <div
            className="relative overflow-y-auto p-6 md:p-10 text-dark-purple"
            style={{ backgroundColor: item.modal.theme }}
          >
            <h2 className="font-desert text-2xl tracking-wide md:text-4xl lg:text-5xl">
              {item.modal.title}
            </h2>
            <p className="text-sm lg:text-base mb-3">{item.modal.retailers}</p>
            <p className="text-base font-desert uppercase lg:text-lg xl:text-xl mb-3">
              {item.modal.categories}
            </p>
            <p className="text-base lg:text-lg xl:text-xl mb-3">
              SIZE: {item.modal.size}
            </p>

            <h3 className="text-base lg:text-lg xl:text-2xl mb-4">
              FRAGRANCE NOTES
            </h3>

            <p className="text-base lg:text-lg xl:text-xl">
              <span className="font-bold tracking-widest font-desert">
                TOP:
              </span>{" "}
              {item.modal.notesTop}
            </p>
            <p className="text-base lg:text-lg xl:text-xl">
              <span className="font-bold tracking-widest font-desert">
                HEART:
              </span>{" "}
              {item.modal.notesHeart}
            </p>
            <p className="text-base lg:text-lg xl:text-xl">
              <span className="font-bold tracking-widest font-desert">
                BASE:
              </span>{" "}
              {item.modal.notesBase}
            </p>

            <h3 className="mt-8 font-desert text-lg lg:text-xl xl:text-2xl tracking-wide">
              DESCRIPTION
            </h3>
            <p className="mt-2 leading-relaxed text-sm lg:text-base xl:text-lg 2xl:text-xl">
              {item.modal.description}
            </p>

            <p
              className="mt-3 xl:mt-0 xl:absolute bottom-4 left-1/2 transform xl:-translate-x-1/2 xl:w-4/5
             text-center text-sm lg:text-base italic opacity-80"
            >
              Extrait de Parfum – <b>20%+</b> fragrance oil concentration for
              richness and longer-lasting wear.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
