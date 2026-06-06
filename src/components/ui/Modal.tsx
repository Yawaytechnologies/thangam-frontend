import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  contentClassName?: string;
  panelClassName?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  contentClassName = 'px-4 pb-4 sm:px-6 sm:pb-6',
  panelClassName = '',
}) => {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

      <div
        className={`relative flex max-h-[calc(100dvh-24px)] w-full ${sizeClasses[size]} flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,20,25,0.30)] ring-1 ring-black/5 sm:max-h-[calc(100dvh-32px)] sm:rounded-[26px] ${panelClassName}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="truncate text-[18px] font-black leading-tight text-slate-950 sm:text-[20px]"
            >
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 truncate text-[12px] font-semibold text-slate-500 sm:text-[13px]">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            aria-label="Close modal"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};