import { forwardRef, useId } from 'react';
import clsx from 'clsx';

const Textarea = forwardRef(function Textarea({ label, hint, error, id, className, ...props }, ref) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  return (
    <div className="w-full">
      {label && <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={clsx('min-h-28 w-full resize-y rounded-control border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20', error && 'border-rose-400', className)}
        {...props}
      />
      {hint && <p id={hintId} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
});

export default Textarea;
