import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({ page, totalPages, onPageChange, label = 'items' }) {
  if (totalPages <= 1) return null;
  const safePage = Math.min(Math.max(page, 1), totalPages);
  return (
    <nav aria-label={`${label} pages`} className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <p className="text-sm text-slate-500">Page <span className="font-semibold text-slate-800">{safePage}</span> of {totalPages}</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={safePage === 1} onClick={() => onPageChange(safePage - 1)} aria-label="Previous page"><ChevronLeft aria-hidden="true" className="h-4 w-4" />Previous</Button>
        <Button variant="secondary" size="sm" disabled={safePage === totalPages} onClick={() => onPageChange(safePage + 1)} aria-label="Next page">Next<ChevronRight aria-hidden="true" className="h-4 w-4" /></Button>
      </div>
    </nav>
  );
}
