import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  danger: 'btn--danger',
  ghost: 'btn--ghost',
  outline: 'btn--outline',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...rest
}) => {
  const classes = [
    'btn',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'btn--full-width' : '',
    loading ? 'btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {!loading && leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
      <span className="btn__label">{children}</span>
      {!loading && rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
    </button>
  );
};

export default Button;
