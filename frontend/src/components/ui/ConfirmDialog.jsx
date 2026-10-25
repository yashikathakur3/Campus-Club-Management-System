import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Confirm', variant = 'danger' }) {
  const [loading, setLoading] = useState(false);
  async function confirm() {
    setLoading(true);
    try { await onConfirm?.(); onClose?.(); }
    finally { setLoading(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} loading={loading} onClick={confirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
