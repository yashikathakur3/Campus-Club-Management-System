import { forwardRef } from 'react';
import clsx from 'clsx';
import { LoaderCircle } from 'lucide-react';

const variants = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-dark',
  secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-danger text-white shadow-sm hover:bg-rose-700',
};
const sizes = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

const Button = forwardRef(function Button({
  variant = 'primary', size = 'md', loading = false, disabled = false,
  className, children, type = 'button', ...props
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none',
        variants[variant], sizes[size], className,
      )}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
});

export default Button;
