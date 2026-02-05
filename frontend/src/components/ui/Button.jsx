import React from 'react';

export default function Button({ children, onClick, className = '', type = 'button', ariaLabel, ...rest }){
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-block rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
}
