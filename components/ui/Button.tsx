import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const baseStyles = 'rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles = {
    primary: 'bg-accent-purple hover:bg-accent-purple/90 text-white shadow-md shadow-accent-purple/20 hover:shadow-lg hover:shadow-accent-purple/25 focus:ring-accent-purple/50 active:scale-[0.98]',
    secondary: 'bg-white hover:bg-brand-light border-2 border-accent-purple text-accent-purple shadow-sm hover:shadow-md focus:ring-accent-purple/50 active:scale-[0.98]',
    tertiary: 'bg-transparent hover:bg-brand-light text-accent-purple hover:text-accent-purple/80 focus:ring-accent-purple/50',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/25 focus:ring-red-500/50 active:scale-[0.98]',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 hover:shadow-lg hover:shadow-green-600/25 focus:ring-green-500/50 active:scale-[0.98]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
};