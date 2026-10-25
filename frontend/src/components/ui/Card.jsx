import clsx from 'clsx';

export default function Card({ children, className, padding = 'p-5 sm:p-6', ...props }) {
  return <section className={clsx('rounded-card border border-slate-200 bg-white shadow-card', padding, className)} {...props}>{children}</section>;
}
