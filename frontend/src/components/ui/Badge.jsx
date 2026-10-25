import clsx from 'clsx';

const styles = {
  neutral: 'bg-slate-100 text-slate-700',
  primary: 'bg-indigo-50 text-indigo-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
};

export default function Badge({ variant = 'neutral', children, className }) {
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', styles[variant] || styles.neutral, className)}>{children}</span>;
}
