import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { AnswerTile } from '@/components/eroot/AnswerTile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { getErootTheme } from '@shared/constants/themes';
import type { ClassicContent, PollContent, QuizContent, SlideDraft } from '@shared/schemas/slide';

interface CreatorPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizTitle: string;
  themeId: string;
  slides: SlideDraft[];
  initialIndex?: number;
}

export function CreatorPreviewModal({
  open,
  onOpenChange,
  quizTitle,
  themeId,
  slides,
  initialIndex = 0,
}: CreatorPreviewModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (open) {
      setIndex(Math.min(initialIndex, Math.max(0, slides.length - 1)));
      setRevealed(false);
    }
  }, [open, initialIndex, slides.length]);

  const slide = slides[index];
  const theme = getErootTheme(themeId);

  if (!slide) return null;

  const options =
    slide.type === 'quiz' || slide.type === 'true_false'
      ? (slide.content as QuizContent).options
      : slide.type === 'poll'
        ? (slide.content as PollContent).options
        : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className={cn('p-6 sm:p-8', theme.stageClass, theme.textClass)}>
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className={theme.textClass}>
                {quizTitle || 'Untitled quiz'} — Preview
              </DialogTitle>
              <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white">
                Slide {index + 1} / {slides.length} · {slide.timeLimit}s
              </span>
            </div>
            <DialogDescription className={theme.subtextClass}>
              Simulated host presentation view (no live game or report is created).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 text-center text-slate-900 shadow-lg">
              <h3 className="font-display text-xl font-bold sm:text-2xl">
                {slide.title.trim() || 'Untitled question'}
              </h3>
            </div>

            {slide.mediaUrl && (
              <div className="flex justify-center">
                <img
                  src={slide.mediaUrl}
                  alt="Preview slide visual"
                  className="max-h-56 rounded-xl bg-white/10 object-contain p-1"
                />
              </div>
            )}

            {slide.type === 'classic' ? (
              <div className="rounded-2xl bg-white/95 p-6 text-center text-slate-800 shadow-md">
                <p className="whitespace-pre-line text-base leading-relaxed">
                  {(slide.content as ClassicContent).body || 'Slide body text...'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {options.map((opt, optIdx) => (
                  <AnswerTile
                    key={opt.id}
                    index={optIdx}
                    label={opt.text || `Answer ${optIdx + 1}`}
                    interactive={false}
                    revealed={revealed && 'isCorrect' in opt}
                    isCorrect={'isCorrect' in opt ? Boolean(opt.isCorrect) : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={index === 0}
                onClick={() => {
                  setIndex((i) => Math.max(0, i - 1));
                  setRevealed(false);
                }}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={index >= slides.length - 1}
                onClick={() => {
                  setIndex((i) => Math.min(slides.length - 1, i + 1));
                  setRevealed(false);
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {slide.type !== 'classic' && slide.type !== 'poll' && (
              <Button
                type="button"
                variant="stage"
                size="sm"
                onClick={() => setRevealed((r) => !r)}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                {revealed ? 'Hide answer' : 'Reveal answer'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
