import type { AnswerShape } from '@shared/constants/answer-tiles';
import { cn } from '@/lib/cn';

interface AnswerShapeIconProps {
  shape: AnswerShape;
  className?: string;
}

export function AnswerShapeIcon({ shape, className }: AnswerShapeIconProps) {
  const baseClass = cn('h-5 w-5 shrink-0 fill-current', className);

  switch (shape) {
    case 'triangle':
      return (
        <svg viewBox="0 0 24 24" className={baseClass} aria-hidden="true">
          <polygon points="12,3 22,20 2,20" />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 24 24" className={baseClass} aria-hidden="true">
          <polygon points="12,2 22,12 12,22 2,12" />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" className={baseClass} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 24 24" className={baseClass} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg viewBox="0 0 24 24" className={baseClass} aria-hidden="true">
          <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={baseClass} aria-hidden="true">
          <polygon points="12,2 15,9 22,9.5 16.5,14.5 18.2,21.5 12,17.8 5.8,21.5 7.5,14.5 2,9.5 9,9" />
        </svg>
      );
  }
}

