import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}

/** Consistent white card used across the application. */
const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClassName = '',
  padded = true,
}) => {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <div className="card__header">
          <div>
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className={`${padded ? 'card__body' : ''} ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
};

export default Card;
