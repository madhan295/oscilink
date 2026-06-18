import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary text-text-primary hover:bg-primary-hover active:scale-[0.98]',
    secondary: 'bg-transparent border border-border-default text-text-primary hover:bg-surface-hover hover:border-border-subtle active:scale-[0.98]',
    danger: 'bg-transparent text-error hover:bg-error hover:text-text-primary active:scale-[0.98]',
    ghost: 'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:scale-[0.98]'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-11 px-6 text-base gap-2.5'
  };

  const classes = clsx(
    baseStyles,
    variants[variant],
    sizes[size],
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin -ml-1 mr-2" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}
