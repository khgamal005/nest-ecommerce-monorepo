'use client';
import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  small?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, small, className, id, ...rest }, ref) => (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-white mb-1"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full px-3 py-2 bg-gray-700 border-2 border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-colors ${small ? 'text-sm' : ''} ${className ?? ''}`}
        {...rest}
      />
    </div>
  )
);

Input.displayName = 'Input';

export default Input;
