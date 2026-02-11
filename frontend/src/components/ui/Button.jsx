import React from 'react';

const Button = React.forwardRef(function Button(
  { children, onClick, className = '', type = 'button', ariaLabel, variant = 'primary', icon, iconPosition = 'left', ...rest },
  ref
) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost'
  }[variant] || 'btn-primary';

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      className={`${variantClass} ${className}`}
      aria-label={ariaLabel}
      {...rest}
    >
      {icon && iconPosition === 'left' && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      <span className="btn-label">{children}</span>
      {icon && iconPosition === 'right' && <span className="btn-icon" aria-hidden="true">{icon}</span>}
    </button>
  );
});

export default Button;
