import React from 'react';
import Button from '@/core/components/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && (
        <Button variant="primary" onClick={action.onClick} style={{ marginTop: '0.5rem' }}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
