import { Check, X } from 'lucide-react';
import { getAnswerTileTheme } from '@shared/constants/answer-tiles';
import { cn } from '@/lib/cn';
import { AnswerShapeIcon } from './AnswerShapeIcon';

export interface AnswerTileProps {
  index: number;
  label?: string;
  imageUrl?: string | null;
  selected?: boolean;
  revealed?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  interactive?: boolean;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AnswerTile({
  index,
  label,
  imageUrl,
  selected = false,
  revealed = false,
  isCorrect,
  disabled = false,
  interactive = true,
  compact = false,
  onClick,
  className,
}: AnswerTileProps) {
  const theme = getAnswerTileTheme(index);
  const trimmedLabel = label?.trim();

  const revealStyles = revealed
    ? isCorrect
      ? 'ring-4 ring-white shadow-lg opacity-100'
      : 'opacity-45 grayscale-[30%]'
    : '';

  const selectedStyles = selected && !revealed ? 'ring-4 ring-white scale-[0.99]' : '';

  const content = (
    <>
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 font-bold',
          theme.badgeBgClass
        )}
      >
        <AnswerShapeIcon shape={theme.shape} className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        <span className="sr-only">Option </span>
        <span className="text-xs font-extrabold">{theme.letter}</span>
        <span className="sr-only"> ({theme.shape}): </span>
      </span>

      <span className="flex-1 text-left font-bold leading-snug break-words">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="mb-1.5 max-h-20 w-auto rounded-md object-contain bg-white/80 p-1"
          />
        )}
        {trimmedLabel ? (
          <span>{trimmedLabel}</span>
        ) : (
          <span className="sr-only">{`Option ${theme.letter}`}</span>
        )}
      </span>

      {revealed && typeof isCorrect === 'boolean' && (
        <span
          className={cn(
            'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            isCorrect ? 'bg-white text-emerald-700' : 'bg-black/25 text-white'
          )}
          aria-label={isCorrect ? 'Correct answer' : 'Incorrect answer'}
        >
          {isCorrect ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-4 w-4" />}
        </span>
      )}
    </>
  );

  const sharedClasses = cn(
    'flex w-full items-center gap-3 rounded-xl border-b-4 transition-all',
    compact ? 'min-h-[56px] px-3 py-2 text-sm' : 'min-h-[76px] px-4 py-3 text-base sm:text-lg',
    theme.tileClasses,
    selectedStyles,
    revealStyles,
    disabled && 'cursor-not-allowed opacity-75',
    className
  );

  if (!interactive) {
    return (
      <div
        data-testid={`answer-tile-${theme.letter}`}
        data-shape={theme.shape}
        className={sharedClasses}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-testid={`answer-tile-${theme.letter}`}
      data-shape={theme.shape}
      aria-pressed={selected || undefined}
      disabled={disabled}
      onClick={onClick}
      className={sharedClasses}
    >
      {content}
    </button>
  );
}
