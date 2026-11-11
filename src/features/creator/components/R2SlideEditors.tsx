import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  parseSafeVideoEmbed,
  type BigMediaContent,
  type BigTitleContent,
  type BulletPointsContent,
  type ClassicContent,
  type NpsScaleContent,
  type OpenEndedContent,
  type PuzzleContent,
  type QuoteContent,
  type ScaleContent,
  type SlideDraft,
  type SliderContent,
  type TypeAnswerContent,
  type VideoContent,
  type WordCloudContent,
} from '@shared/schemas/slide';
import type { SlideValidationResult } from '@shared/validation/quiz-validation';

interface R2SlideEditorProps {
  slide: SlideDraft;
  validation?: SlideValidationResult;
  onUpdateSlide: (updater: (slide: SlideDraft) => SlideDraft) => void;
}

function Tooltip({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mt-1 inline-flex items-center rounded-md bg-violet-700 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
    >
      {message}
    </div>
  );
}

export function R2SlideEditor({ slide, validation, onUpdateSlide }: R2SlideEditorProps) {
  switch (slide.type) {
    case 'type_answer': {
      const content = slide.content as TypeAnswerContent;
      const accepted = content.acceptedAnswers ?? [''];
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">
              Accepted answers (case-insensitive, trimmed, max 20 chars)
            </p>
            {accepted.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onUpdateSlide((s) => ({
                    ...s,
                    content: {
                      acceptedAnswers: [...(s.content as TypeAnswerContent).acceptedAnswers, ''],
                    },
                  }))
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add accepted answer
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {accepted.map((ans, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  aria-label={`Accepted answer ${idx + 1}`}
                  maxLength={20}
                  value={ans}
                  placeholder={`Accepted answer ${idx + 1}`}
                  onChange={(e) =>
                    onUpdateSlide((s) => {
                      const list = [...(s.content as TypeAnswerContent).acceptedAnswers];
                      list[idx] = e.target.value;
                      return { ...s, content: { acceptedAnswers: list } };
                    })
                  }
                />
                {accepted.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove accepted answer ${idx + 1}`}
                    onClick={() =>
                      onUpdateSlide((s) => ({
                        ...s,
                        content: {
                          acceptedAnswers: (
                            s.content as TypeAnswerContent
                          ).acceptedAnswers.filter((_, i) => i !== idx),
                        },
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {validation?.correctError && <Tooltip message={validation.correctError} />}
        </div>
      );
    }

    case 'slider': {
      const cfg = slide.content as SliderContent;
      const updateSlider = (patch: Partial<SliderContent>) =>
        onUpdateSlide((s) => ({
          ...s,
          content: { ...(s.content as SliderContent), ...patch },
        }));

      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="slider-min">Min</Label>
              <Input
                id="slider-min"
                type="number"
                value={cfg.min}
                onChange={(e) => updateSlider({ min: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slider-max">Max</Label>
              <Input
                id="slider-max"
                type="number"
                value={cfg.max}
                onChange={(e) => updateSlider({ max: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slider-step">Step</Label>
              <Input
                id="slider-step"
                type="number"
                value={cfg.step}
                onChange={(e) => updateSlider({ step: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slider-correct">Correct value</Label>
              <Input
                id="slider-correct"
                type="number"
                value={cfg.correctValue}
                onChange={(e) => updateSlider({ correctValue: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slider-tolerance">Tolerance (+/-)</Label>
              <Input
                id="slider-tolerance"
                type="number"
                value={cfg.tolerance}
                onChange={(e) => updateSlider({ tolerance: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slider-unit">Unit (optional)</Label>
              <Input
                id="slider-unit"
                value={cfg.unit}
                placeholder="km, %, °C"
                onChange={(e) => updateSlider({ unit: e.target.value })}
              />
            </div>
          </div>
          {validation?.bodyError && <Tooltip message={validation.bodyError} />}
          {validation?.correctError && <Tooltip message={validation.correctError} />}
        </div>
      );
    }

    case 'puzzle': {
      const items = (slide.content as PuzzleContent).items ?? [];
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-3">
          <p className="text-sm font-bold text-slate-900">
            Correct sequence (top to bottom — players receive shuffled tiles)
          </p>
          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-extrabold text-indigo-800">
                    {idx + 1}
                  </span>
                  <Input
                    aria-label={`Puzzle item ${idx + 1}`}
                    value={item.text}
                    placeholder={`Item ${idx + 1} in correct order`}
                    onChange={(e) =>
                      onUpdateSlide((s) => ({
                        ...s,
                        content: {
                          items: (s.content as PuzzleContent).items.map((it, i) =>
                            i === idx ? { ...it, text: e.target.value } : it
                          ),
                        },
                      }))
                    }
                  />
                </div>
                {validation?.optionErrors[idx] && (
                  <Tooltip message={validation.optionErrors[idx]!} />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'scale': {
      const cfg = slide.content as ScaleContent;
      const update = (patch: Partial<ScaleContent>) =>
        onUpdateSlide((s) => ({ ...s, content: { ...(s.content as ScaleContent), ...patch } }));
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="scale-min">Min value</Label>
            <Input
              id="scale-min"
              type="number"
              value={cfg.min}
              onChange={(e) => update({ min: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="scale-max">Max value</Label>
            <Input
              id="scale-max"
              type="number"
              value={cfg.max}
              onChange={(e) => update({ max: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="scale-min-label">Low endpoint label</Label>
            <Input
              id="scale-min-label"
              value={cfg.minLabel}
              onChange={(e) => update({ minLabel: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="scale-max-label">High endpoint label</Label>
            <Input
              id="scale-max-label"
              value={cfg.maxLabel}
              onChange={(e) => update({ maxLabel: e.target.value })}
            />
          </div>
        </div>
      );
    }

    case 'nps_scale': {
      const cfg = slide.content as NpsScaleContent;
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-3">
          <p className="text-sm font-bold text-slate-900">
            0–10 Net Promoter Scale (0–6 Detractors, 7–8 Passives, 9–10 Promoters)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nps-low">0 label</Label>
              <Input
                id="nps-low"
                value={cfg.minLabel}
                onChange={(e) =>
                  onUpdateSlide((s) => ({
                    ...s,
                    content: { ...(s.content as NpsScaleContent), minLabel: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nps-high">10 label</Label>
              <Input
                id="nps-high"
                value={cfg.maxLabel}
                onChange={(e) =>
                  onUpdateSlide((s) => ({
                    ...s,
                    content: { ...(s.content as NpsScaleContent), maxLabel: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>
      );
    }

    case 'word_cloud': {
      const cfg = slide.content as WordCloudContent;
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-2">
          <Label htmlFor="wc-hint">Player input prompt hint (max 30 chars per submission)</Label>
          <Input
            id="wc-hint"
            value={cfg.promptHint}
            onChange={(e) =>
              onUpdateSlide((s) => ({ ...s, content: { promptHint: e.target.value } }))
            }
          />
        </div>
      );
    }

    case 'open_ended': {
      const cfg = slide.content as OpenEndedContent;
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-2">
          <Label htmlFor="oe-hint">Player prompt hint (up to 250 characters)</Label>
          <Input
            id="oe-hint"
            value={cfg.promptHint}
            onChange={(e) =>
              onUpdateSlide((s) => ({
                ...s,
                content: { ...(s.content as OpenEndedContent), promptHint: e.target.value },
              }))
            }
          />
        </div>
      );
    }

    case 'classic':
    case 'title_text': {
      const cfg = slide.content as ClassicContent;
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-2">
          <Label htmlFor="classic-body-input">Slide text</Label>
          <textarea
            id="classic-body-input"
            rows={4}
            value={cfg.body}
            onChange={(e) =>
              onUpdateSlide((s) => ({ ...s, content: { body: e.target.value } }))
            }
            placeholder="Write supporting explanation or context for participants..."
            className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {validation?.bodyError && <Tooltip message={validation.bodyError} />}
        </div>
      );
    }

    case 'big_title': {
      const cfg = slide.content as BigTitleContent;
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-2">
          <Label htmlFor="big-title-sub">Subtitle</Label>
          <Input
            id="big-title-sub"
            value={cfg.subtitle}
            placeholder="Optional section subtitle"
            onChange={(e) =>
              onUpdateSlide((s) => ({ ...s, content: { subtitle: e.target.value } }))
            }
          />
        </div>
      );
    }

    case 'bullet_points': {
      const bullets = (slide.content as BulletPointsContent).bullets ?? [''];
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <Label>Bullet points</Label>
            {bullets.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onUpdateSlide((s) => ({
                    ...s,
                    content: {
                      bullets: [...(s.content as BulletPointsContent).bullets, ''],
                    },
                  }))
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add bullet
              </Button>
            )}
          </div>
          {bullets.map((b, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={b}
                placeholder={`Bullet ${idx + 1}`}
                onChange={(e) =>
                  onUpdateSlide((s) => {
                    const next = [...(s.content as BulletPointsContent).bullets];
                    next[idx] = e.target.value;
                    return { ...s, content: { bullets: next } };
                  })
                }
              />
              {bullets.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onUpdateSlide((s) => ({
                      ...s,
                      content: {
                        bullets: (s.content as BulletPointsContent).bullets.filter(
                          (_, i) => i !== idx
                        ),
                      },
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          ))}
          {validation?.bodyError && <Tooltip message={validation.bodyError} />}
        </div>
      );
    }

    case 'quote': {
      const cfg = slide.content as QuoteContent;
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-3">
          <div className="space-y-1">
            <Label htmlFor="quote-text">Quote</Label>
            <textarea
              id="quote-text"
              rows={3}
              value={cfg.quote}
              placeholder="Featured quote..."
              onChange={(e) =>
                onUpdateSlide((s) => ({
                  ...s,
                  content: { ...(s.content as QuoteContent), quote: e.target.value },
                }))
              }
              className="w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quote-author">Author</Label>
            <Input
              id="quote-author"
              value={cfg.author}
              placeholder="Attribution"
              onChange={(e) =>
                onUpdateSlide((s) => ({
                  ...s,
                  content: { ...(s.content as QuoteContent), author: e.target.value },
                }))
              }
            />
          </div>
          {validation?.bodyError && <Tooltip message={validation.bodyError} />}
        </div>
      );
    }

    case 'big_media': {
      const cfg = slide.content as BigMediaContent;
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-2">
          <Label htmlFor="big-media-caption">Caption</Label>
          <Input
            id="big-media-caption"
            value={cfg.caption}
            placeholder="Describe this visual..."
            onChange={(e) =>
              onUpdateSlide((s) => ({ ...s, content: { caption: e.target.value } }))
            }
          />
          {validation?.bodyError && <Tooltip message={validation.bodyError} />}
        </div>
      );
    }

    case 'video': {
      const cfg = slide.content as VideoContent;
      const embedUrl = parseSafeVideoEmbed(cfg.videoUrl ?? '');
      return (
        <div className="rounded-2xl bg-white p-5 shadow-md space-y-3">
          <div className="space-y-1">
            <Label htmlFor="video-url">YouTube or Vimeo HTTPS URL</Label>
            <Input
              id="video-url"
              type="url"
              value={cfg.videoUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(e) =>
                onUpdateSlide((s) => ({
                  ...s,
                  content: { ...(s.content as VideoContent), videoUrl: e.target.value },
                }))
              }
            />
          </div>
          {embedUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
              <iframe
                src={embedUrl}
                title={slide.title || 'Embedded video'}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="video-caption">Caption (optional)</Label>
            <Input
              id="video-caption"
              value={cfg.caption}
              onChange={(e) =>
                onUpdateSlide((s) => ({
                  ...s,
                  content: { ...(s.content as VideoContent), caption: e.target.value },
                }))
              }
            />
          </div>
          {validation?.bodyError && <Tooltip message={validation.bodyError} />}
        </div>
      );
    }

    default:
      return null;
  }
}

