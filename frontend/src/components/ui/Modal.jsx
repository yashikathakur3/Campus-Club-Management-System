import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, description, children, size = 'max-w-lg' }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () => dialog?.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || [];
    focusable()[0]?.focus();
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'Tab') {
        const elements = [...focusable()];
        if (!elements.length) { event.preventDefault(); dialog?.focus(); return; }
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={`relative my-auto w-full ${size} rounded-2xl bg-white p-6 shadow-md`}>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X aria-hidden="true" className="h-5 w-5" /></button>
        <h2 id={titleId} className="pr-10 text-lg font-bold text-slate-900">{title}</h2>
        {description && <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
        <div className="mt-5">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
