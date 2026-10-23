import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  const variantStyles = {
    primary:
      'bg-[#60d1d4] hover:bg-[#3eb8bb] text-[#062224] shadow-sm shadow-[#60d1d4]/30 hover:shadow-md focus:ring-[#60d1d4] active:scale-[0.98]',
    secondary:
      'bg-[#e2f7f9] hover:bg-[#d1f4f3] text-[#062224] border border-[#b1f0ee] focus:ring-[#95dfdd]',
    outline:
      'bg-transparent border-2 border-[#60d1d4] text-[#062224] hover:bg-[#e2f7f9] focus:ring-[#60d1d4]',
    ghost:
      'bg-transparent hover:bg-gray-100 text-[#062224] focus:ring-gray-300',
    danger:
      'bg-red-500 hover:bg-red-600 text-white shadow-sm focus:ring-red-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#062224]" />
      ) : (
        leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
};
