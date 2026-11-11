import { useRef, useState, type DragEvent } from 'react';
import { Check, Plus, Trash2, Upload } from 'lucide-react';
import { AnswerShapeIcon } from '@/components/eroot/AnswerShapeIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';
import { getAnswerTileTheme } from '@shared/constants/answer-tiles';
import { getErootTheme } from '@shared/constants/themes';
import {
  createSlideId,
  type ClassicContent,
  type PollContent,
  type QuizContent,
  type SlideDraft,
} from '@shared/schemas/slide';
import type { SlideValidationResult } from '@shared/validation/quiz-validation';

interface SlideCanvasProps {
  slide: SlideDraft;
  themeId: string;
  validation?: SlideValidationResult;
  onUpdateSlide: (updater: (slide: SlideDraft) => SlideDraft) => void;
  onUploadImage: (file: File) => Promise<string>;
}

function PurpleTooltip({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mt-1 inline-flex items-center rounded-md bg-violet-700 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
    >
      {message}
    </div>
  );
}

export function SlideCanvas({
  slide,
  themeId,
  validation,
  onUpdateSlide,
  onUploadImage,
}: SlideCanvasProps) {
  const { t } = useTranslation();
  const theme = getErootTheme(themeId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  async function processFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const publicUrl = await onUploadImage(file);
      onUpdateSlide((s) => ({ ...s, mediaUrl: publicUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    void processFile(file);
  }

  const options =
    slide.type === 'quiz' || slide.type === 'true_false'
      ? (slide.content as QuizContent).options
      : slide.type === 'poll'
        ? (slide.content as PollContent).options
        : [];

  return (
    <section
      aria-label="Slide canvas"
      className={cn('flex-1 overflow-y-auto p-6 sm:p-8', theme.canvasBackdropClass)}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* Question Title Input */}
        <div className="rounded-2xl bg-white p-4 shadow-md">
          <label htmlFor="slide-question-input" className="sr-only">
            Question text
          </label>
          <Input
            id="slide-question-input"
            value={slide.title}
            maxLength={200}
            placeholder={t('creator.questionPlaceholder')}
            aria-invalid={Boolean(validation?.questionError)}
            onChange={(e) =>
              onUpdateSlide((s) => ({
                ...s,
                title: e.target.value,
              }))
            }
            className="h-14 border-none text-center text-lg font-bold text-slate-900 shadow-none focus:ring-0 sm:text-2xl"
          />
          {validation?.questionError && (
            <div className="flex justify-center">
              <PurpleTooltip message={validation.questionError} />
            </div>
          )}
        </div>

        {/* Media Block */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDrop}
          className={cn(
            'mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white/90 p-6 text-center shadow-sm transition-colors',
            isDraggingFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'
          )}
        >
          {slide.mediaUrl ? (
            <div className="space-y-3 w-full">
              <img
                src={slide.mediaUrl}
                alt="Slide visual"
                className="mx-auto max-h-56 rounded-xl object-contain"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onUpdateSlide((s) => ({ ...s, mediaUrl: null }))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('creator.removeMedia')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Upload className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('creator.mediaDropzoneTitle')}
                </p>
                <p className="text-xs text-slate-600">{t('creator.mediaDropzoneSubtitle')}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => void processFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose image
              </Button>
              {uploadError && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {uploadError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Slide Type Content Area */}
        {slide.type === 'classic' ? (
          <div className="rounded-2xl bg-white p-5 shadow-md space-y-2">
            <label htmlFor="classic-body-input" className="text-sm font-semibold text-slate-800">
              Slide text
            </label>
            <textarea
              id="classic-body-input"
              rows={4}
              value={(slide.content as ClassicContent).body}
              onChange={(e) =>
                onUpdateSlide((s) => ({
                  ...s,
                  content: { body: e.target.value },
                }))
              }
              placeholder="Write supporting explanation or context for participants..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {validation?.bodyError && <PurpleTooltip message={validation.bodyError} />}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {options.map((opt, idx) => {
                const tileTheme = getAnswerTileTheme(idx);
                const optErr = validation?.optionErrors[idx];
                const isQuizOption = 'isCorrect' in opt && typeof opt.isCorrect === 'boolean';
                const optIsCorrect = isQuizOption ? Boolean(opt.isCorrect) : false;
                const isTrueFalse = slide.type === 'true_false';

                return (
                  <div key={opt.id} className="space-y-1">
                    <div
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border-b-4 p-3 shadow-sm',
                        tileTheme.tileClasses
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 font-bold',
                          tileTheme.badgeBgClass
                        )}
                      >
                        <AnswerShapeIcon shape={tileTheme.shape} className="h-5 w-5" />
                        <span className="text-xs">{tileTheme.letter}</span>
                      </span>

                      <input
                        type="text"
                        aria-label={`Answer ${idx + 1}`}
                        readOnly={isTrueFalse}
                        value={opt.text}
                        placeholder={
                          idx < 2
                            ? t('creator.answerPlaceholder', { num: String(idx + 1) })
                            : t('creator.optionalAnswerPlaceholder', { num: String(idx + 1) })
                        }
                        onChange={(e) =>
                          onUpdateSlide((s) => {
                            if (s.type === 'poll') {
                              const prev = (s.content as PollContent).options;
                              return {
                                ...s,
                                content: {
                                  options: prev.map((o, i) =>
                                    i === idx ? { ...o, text: e.target.value } : o
                                  ),
                                },
                              };
                            }
                            const prev = (s.content as QuizContent).options;
                            return {
                              ...s,
                              content: {
                                options: prev.map((o, i) =>
                                  i === idx ? { ...o, text: e.target.value } : o
                                ),
                              },
                            };
                          })
                        }
                        className={cn(
                          'min-w-0 flex-1 rounded-md bg-white/90 px-2.5 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/30',
                          isTrueFalse && 'cursor-default'
                        )}
                      />

                      {isQuizOption && (
                        <button
                          type="button"
                          aria-label={`Mark answer ${idx + 1} as correct`}
                          aria-pressed={optIsCorrect}
                          onClick={() =>
                            onUpdateSlide((s) => {
                              const prev = (s.content as QuizContent).options;
                              return {
                                ...s,
                                content: {
                                  options: prev.map((o, i) => {
                                    if (s.type === 'true_false') {
                                      return { ...o, isCorrect: i === idx };
                                    }
                                    return i === idx ? { ...o, isCorrect: !o.isCorrect } : o;
                                  }),
                                },
                              };
                            })
                          }
                          className={cn(
                            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            optIsCorrect
                              ? 'border-white bg-emerald-500 text-white'
                              : 'border-white/70 bg-black/20 text-white/70 hover:bg-black/35'
                          )}
                        >
                          <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
                        </button>
                      )}

                      {((slide.type === 'quiz' && options.length > 2) ||
                        (slide.type === 'poll' && options.length > 2)) && (
                        <button
                          type="button"
                          aria-label={`Remove answer ${idx + 1}`}
                          onClick={() =>
                            onUpdateSlide((s) => {
                              if (s.type === 'poll') {
                                return {
                                  ...s,
                                  content: {
                                    options: (s.content as PollContent).options.filter(
                                      (_, i) => i !== idx
                                    ),
                                  },
                                };
                              }
                              return {
                                ...s,
                                content: {
                                  options: (s.content as QuizContent).options.filter(
                                    (_, i) => i !== idx
                                  ),
                                },
                              };
                            })
                          }
                          className="rounded-md p-1.5 bg-black/20 text-white hover:bg-black/35"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    {optErr && <PurpleTooltip message={optErr} />}
                  </div>
                );
              })}
            </div>

            {validation?.correctError && (
              <div className="flex justify-center">
                <PurpleTooltip message={validation.correctError} />
              </div>
            )}

            {((slide.type === 'quiz' && options.length < 6) ||
              (slide.type === 'poll' && options.length < 4)) && (
              <div className="flex justify-center pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onUpdateSlide((s) => {
                      if (s.type === 'poll') {
                        return {
                          ...s,
                          content: {
                            options: [
                              ...(s.content as PollContent).options,
                              { id: createSlideId(), text: '' },
                            ],
                          },
                        };
                      }
                      return {
                        ...s,
                        content: {
                          options: [
                            ...(s.content as QuizContent).options,
                            { id: createSlideId(), text: '', isCorrect: false },
                          ],
                        },
                      };
                    })
                  }
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('creator.addMoreAnswers')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
