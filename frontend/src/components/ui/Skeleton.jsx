import clsx from 'clsx';

export default function Skeleton({ className }) {
  return <div aria-hidden="true" className={clsx('animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none', className)} />;
}
