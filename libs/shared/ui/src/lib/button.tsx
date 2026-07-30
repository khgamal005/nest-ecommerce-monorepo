import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';
  const variants: Record<string, string> = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-gray-100 text-black hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
