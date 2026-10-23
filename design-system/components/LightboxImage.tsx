"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { assetUrl } from "../asset";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src: string;
  /** Required: it names the button and the dialog. Describe the picture, not the action. */
  alt: string;
};

/**
 * An image that opens larger in a modal. Built on the native <dialog>, so the browser handles the focus
 * trap, Escape to close, inert background and returning focus to the button. The large copy is only
 * mounted while open, so it never loads twice. Clicking the backdrop or the close button also closes it.
 */
export function LightboxImage({ src, alt, className = "", ...imgProps }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Stop the page behind the dialog from scrolling.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View larger: ${alt}`}
        aria-haspopup="dialog"
        className="block w-full cursor-zoom-in text-left"
      >
        <img src={assetUrl(src)} alt="" className={className} {...imgProps} />
      </button>
      {/* Backdrop click is a mouse convenience only: keyboard users close with Escape or the Close button. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialog}
        aria-label={alt}
        onClose={() => setOpen(false)}
        // A click on the dialog element itself (not its contents) is a click on the backdrop.
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="m-auto max-h-[94vh] max-w-[94vw] overflow-visible bg-transparent p-0 text-text backdrop:bg-void/90 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div className="relative">
            <img src={assetUrl(src)} alt={alt} className="max-h-[90vh] max-w-[94vw] rounded-card border border-line object-contain shadow-glow-magenta" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -right-3 -top-3 grid size-11 place-items-center rounded-full border border-line bg-raised text-text hover:text-magenta"
            >
              <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
