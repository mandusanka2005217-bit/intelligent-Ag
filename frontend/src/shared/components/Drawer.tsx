import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}

/** Right-hand detail drawer used for explanations. */
const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 460,
  footer,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="drawer"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Details'}
        tabIndex={-1}
        ref={panelRef}
      >
        <header className="drawer__header">
          <div>
            <h2 className="drawer__title">{title}</h2>
            {subtitle && <p className="drawer__subtitle">{subtitle}</p>}
          </div>
          <button className="drawer__close" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </header>
        <div className="drawer__body">{children}</div>
        {footer && <footer className="drawer__footer">{footer}</footer>}
      </aside>
    </div>
  );
};

export default Drawer;
