import { cn } from '@/lib/cn';

interface ErootLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ErootLogo({ variant = 'light', size = 'md', className }: ErootLogoProps) {
  const sizes = {
    sm: { icon: 'h-7 w-7', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-xl' },
    lg: { icon: 'h-10 w-10', text: 'text-2xl' },
  }[size];

  const textColor = variant === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className={cn(sizes.icon, 'shrink-0')}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill={variant === 'dark' ? '#4f46e5' : '#1e1b4b'} />
        <path d="M18 20h28v7H25v6h17v7H25v6h21v7H18V20z" fill="#ffffff" />
        <circle cx="48" cy="18" r="5" fill="#eab308" />
      </svg>
      <span className={cn('font-display font-extrabold tracking-tight', sizes.text, textColor)}>
        Eroot
      </span>
    </span>
  );
}

