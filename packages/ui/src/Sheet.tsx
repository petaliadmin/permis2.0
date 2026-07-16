'use client';

import React from 'react';
import { cn } from './utils/cn';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Accessible label for the dialog */
  ariaLabel?: string;
  className?: string;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Bottom sheet — the native-mobile modal pattern (slides up from the bottom,
 * dimmed backdrop, rounded top corners, drag handle). Pure CSS transitions so
 * the UI package stays dependency-light. Closes on backdrop tap or Escape.
 * Focus is moved into the panel when opened and returned on close.
 */
function Sheet({ open, onClose, children, ariaLabel, className }: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<Element | null>(null);
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const dragState = React.useRef<{ startY: number; startTime: number } | null>(null);

  // Lock body scroll, handle Escape key, and manage focus.
  React.useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Trap focus inside the panel.
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    // Move focus to the first focusable element in the panel.
    const raf = requestAnimationFrame(() => {
      if (panelRef.current) {
        const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();
      }
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      cancelAnimationFrame(raf);
      // Return focus to the triggering element.
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open, onClose]);

  // Reset any leftover drag offset whenever the sheet is opened.
  React.useEffect(() => {
    if (open) setDragY(0);
  }, [open]);

  const onHandlePointerDown = (e: React.PointerEvent) => {
    dragState.current = { startY: e.clientY, startTime: Date.now() };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const delta = e.clientY - dragState.current.startY;
    if (delta > 0) setDragY(delta);
  };

  const onHandlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const delta = e.clientY - dragState.current.startY;
    const elapsed = Date.now() - dragState.current.startTime;
    const velocity = delta / Math.max(elapsed, 1);
    dragState.current = null;
    setDragging(false);
    if (delta > 120 || velocity > 0.5) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-50 transition-opacity duration-300',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-dark/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface-1 shadow-card',
          'pb-[env(safe-area-inset-bottom)]',
          className
        )}
        style={{
          transform: open ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: dragging ? 'none' : 'transform 300ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex touch-none justify-center pt-3"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <span className="h-1.5 w-10 rounded-full bg-surface-3" />
        </div>
        <div className="px-5 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}

export { Sheet };
