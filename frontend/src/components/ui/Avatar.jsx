import { useState } from 'react';
import clsx from 'clsx';

const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-14 w-14 text-base' };

function initials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

export default function Avatar({ name, src, size = 'md', className }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img src={src} alt={`${name || 'User'} avatar`} onError={() => setFailed(true)} className={clsx('rounded-full object-cover ring-1 ring-slate-200', sizes[size] || sizes.md, className)} />
  ) : (
    <span aria-label={`${name || 'User'} initials`} className={clsx('inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ring-1 ring-indigo-200', sizes[size] || sizes.md, className)}>{initials(name)}</span>
  );
}
