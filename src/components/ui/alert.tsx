import * as React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'error' | 'success';
  title?: string;
}

export function Alert({ variant = 'info', title, className, children, ...props }: AlertProps) {
  const styles = {
    info: 'border-indigo-200 bg-indigo-50 text-indigo-950',
    error: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  }[variant];

  const Icon = variant === 'error' ? AlertCircle : variant === 'success' ? CheckCircle2 : Info;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-xl border p-4 text-sm', styles, className)}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

