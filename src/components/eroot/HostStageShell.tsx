import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface HostStageShellProps {
  children: ReactNode;
  className?: string;
}

export function HostStageShell({ children, className }: HostStageShellProps) {
  return (
    <div className={cn('eroot-stage-bg min-h-screen w-full text-white', className)}>
      {children}
    </div>
  );
}

