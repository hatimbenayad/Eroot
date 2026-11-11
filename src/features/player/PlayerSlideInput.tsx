import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Send } from 'lucide-react';
import { AnswerTile } from '@/components/eroot/AnswerTile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PublicSlide } from '@shared/schemas/sanitizer';
import type { PuzzleItem } from '@shared/schemas/slide';

export interface PlayerAnswerPayload {
  optionId?: string;
  optionIds?: string[];
  text?: string;
  value?: number;
  order?: string[];
}

export function PlayerSlideInput({
  slide,
  showQuestionOnDevices,
  submitting,
  onSubmit,
}: {
  slide: PublicSlide;
  showQuestionOnDevices: boolean;
  submitting: boolean;
  onSubmit: (payload: PlayerAnswerPayload) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [textValue, setTextValue] = useState('');
  const [sliderValue, setSliderValue] = useState<number>(slide.sliderConfig?.min ?? 0);
  const [puzzleOrder, setPuzzleOrder] = useState<PuzzleItem[]>(slide.puzzleItems ?? []);

  useEffect(() => {
    setSelectedIds([]);
    setTextValue('');
    if (slide.sliderConfig) {
      setSliderValue(
        Math.round((slide.sliderConfig.min + slide.sliderConfig.max) / 2 / slide.sliderConfig.step) *
          slide.sliderConfig.step
      );
    }
    setPuzzleOrder(slide.puzzleItems ?? []);
  }, [slide.id, slide.sliderConfig, slide.puzzleItems]);

  if (
    (slide.type === 'quiz' && slide.selectMode === 'single') ||
    slide.type === 'true_false' ||
    slide.type === 'poll'
  ) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {slide.options.map((opt, idx) => (
          <AnswerTile
            key={opt.id}
            index={idx}
            label={showQuestionOnDevices ? opt.text : undefined}
            imageUrl={showQuestionOnDevices ? opt.imageUrl : undefined}
            disabled={submitting}
            onClick={() => onSubmit({ optionId: opt.id })}
            className="min-h-[96px]"
          />
        ))}
      </div>
    );
  }

  if (slide.type === 'quiz' && slide.selectMode === 'multi') {
    const toggle = (id: string) =>
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );

    return (
      <div className="space-y-4">
        <p className="text-center text-xs font-bold uppercase tracking-wider opacity-90">
          Multi-select: pick all correct answers, then submit
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {slide.options.map((opt, idx) => (
            <AnswerTile
              key={opt.id}
              index={idx}
              label={showQuestionOnDevices ? opt.text : undefined}
              imageUrl={showQuestionOnDevices ? opt.imageUrl : undefined}
              selected={selectedIds.includes(opt.id)}
              disabled={submitting}
              onClick={() => toggle(opt.id)}
              className="min-h-[88px]"
            />
          ))}
        </div>
        <Button
          type="button"
          variant="stage"
          size="lg"
          className="w-full"
          disabled={selectedIds.length === 0 || submitting}
          onClick={() => onSubmit({ optionIds: selectedIds })}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Submit ({selectedIds.length})
        </Button>
      </div>
    );
  }

  if (slide.type === 'type_answer' || slide.type === 'word_cloud') {
    const maxLen = slide.type === 'type_answer' ? 20 : 30;
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (textValue.trim()) onSubmit({ text: textValue.trim() });
        }}
        className="rounded-2xl bg-white p-5 text-slate-900 shadow-lg space-y-3"
      >
        <Input
          aria-label="Your answer"
          maxLength={maxLen}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={slide.promptHint || `Type answer (max ${maxLen} chars)`}
          className="h-12 text-base font-semibold"
        />
        <Button type="submit" size="lg" className="w-full" disabled={!textValue.trim() || submitting}>
          Submit
        </Button>
      </form>
    );
  }

  if (slide.type === 'open_ended') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (textValue.trim()) onSubmit({ text: textValue.trim() });
        }}
        className="rounded-2xl bg-white p-5 text-slate-900 shadow-lg space-y-3"
      >
        <textarea
          aria-label="Your response"
          rows={4}
          maxLength={slide.maxLength ?? 250}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={slide.promptHint || 'Share your response...'}
          className="w-full rounded-lg border border-slate-300 p-3 text-base"
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {textValue.length} / {slide.maxLength ?? 250}
          </span>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={!textValue.trim() || submitting}>
          Submit response
        </Button>
      </form>
    );
  }

  if (slide.type === 'slider' && slide.sliderConfig) {
    const { min, max, step, unit } = slide.sliderConfig;
    return (
      <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-lg space-y-4">
        <div className="text-center">
          <p className="font-display text-4xl font-black text-indigo-700">
            {sliderValue} {unit}
          </p>
        </div>
        <input
          type="range"
          aria-label="Slider answer"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full accent-indigo-600 h-3 cursor-pointer"
        />
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>
            {min} {unit}
          </span>
          <span>
            {max} {unit}
          </span>
        </div>
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={submitting}
          onClick={() => onSubmit({ value: sliderValue })}
        >
          Lock in estimate
        </Button>
      </div>
    );
  }

  if (slide.type === 'puzzle') {
    const move = (idx: number, delta: -1 | 1) => {
      const target = idx + delta;
      if (target < 0 || target >= puzzleOrder.length) return;
      const copy = [...puzzleOrder];
      const item = copy[idx]!;
      copy[idx] = copy[target]!;
      copy[target] = item;
      setPuzzleOrder(copy);
    };

    return (
      <div className="space-y-3">
        {puzzleOrder.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-slate-900 shadow"
          >
            <span className="font-bold">
              {idx + 1}. {item.text}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Move ${item.text} up`}
                disabled={idx === 0}
                onClick={() => move(idx, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Move ${item.text} down`}
                disabled={idx === puzzleOrder.length - 1}
                onClick={() => move(idx, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="stage"
          size="lg"
          className="w-full"
          disabled={submitting || puzzleOrder.length !== 4}
          onClick={() => onSubmit({ order: puzzleOrder.map((i) => i.id) })}
        >
          Submit sequence
        </Button>
      </div>
    );
  }

  if ((slide.type === 'scale' || slide.type === 'nps_scale') && slide.scaleConfig) {
    const nums: number[] = [];
    for (let v = slide.scaleConfig.min; v <= slide.scaleConfig.max; v++) {
      nums.push(v);
    }
    return (
      <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-lg space-y-4">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>{slide.scaleConfig.minLabel}</span>
          <span>{slide.scaleConfig.maxLabel}</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {nums.map((n) => (
            <Button
              key={n}
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onSubmit({ value: n })}
              className="h-12 text-lg font-extrabold hover:bg-indigo-600 hover:text-white"
            >
              {n}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

