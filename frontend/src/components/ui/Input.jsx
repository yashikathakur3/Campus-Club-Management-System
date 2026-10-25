import { forwardRef, useId } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input({ label, hint, error, id, className, ...props }, ref) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={clsx(
          'min-h-11 w-full rounded-control border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition duration-150 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 motion-reduce:transition-none',
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200',
          className,
        )}
        {...props}
      />
      {hint && <p id={hintId} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
});

export default Input;
