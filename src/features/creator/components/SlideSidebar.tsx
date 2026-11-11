import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, Copy, GripVertical, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';
import type { SlideDraft, SlideType } from '@shared/schemas/slide';
import type { SlideValidationResult } from '@shared/validation/quiz-validation';

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  quiz: 'Quiz',
  true_false: 'True or false',
  poll: 'Poll',
  classic: 'Classic',
};

interface SortableSlideItemProps {
  slide: SlideDraft;
  index: number;
  total: number;
  isActive: boolean;
  isValid: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableSlideItem({
  slide,
  index,
  total,
  isActive,
  isValid,
  onSelect,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SortableSlideItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`slide-item-${index}`}
      className={cn('group relative flex items-stretch gap-1', isDragging && 'z-20 opacity-75')}
    >
      <div className="flex flex-col items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Drag slide ${index + 1}`}
          className="cursor-grab rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Duplicate slide ${index + 1}`}
          onClick={onDuplicate}
          className="rounded p-0.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-slate-200 hover:text-slate-800"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Delete slide ${index + 1}`}
          disabled={total <= 1}
          onClick={onDelete}
          className="rounded p-0.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-25"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? 'step' : undefined}
        className={cn(
          'relative flex-1 rounded-xl border bg-white p-2.5 text-left transition-all',
          isActive
            ? 'border-indigo-600 ring-2 ring-indigo-600 shadow-sm'
            : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <div className="mb-1.5 flex items-center justify-between gap-1 text-xs font-semibold text-slate-700">
          <span>
            {index + 1} {SLIDE_TYPE_LABELS[slide.type]}
          </span>
          <div className="flex items-center gap-1">
            {!isValid && (
              <span
                title="Incomplete slide"
                aria-label="Incomplete slide"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white"
              >
                !
              </span>
            )}
          </div>
        </div>

        <p className="line-clamp-2 min-h-[2rem] text-xs text-slate-600">
          {slide.title.trim() || 'Question'}
        </p>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span className="inline-flex items-center rounded-full border border-slate-200 px-1.5 py-0.5 font-medium">
            {slide.timeLimit}s
          </span>
          {slide.mediaUrl && <ImageIcon className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />}
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-1">
          <span className="h-1.5 rounded-full bg-red-400/70" />
          <span className="h-1.5 rounded-full bg-blue-400/70" />
          {slide.type !== 'true_false' && slide.type !== 'classic' && (
            <>
              <span className="h-1.5 rounded-full bg-amber-400/80" />
              <span className="h-1.5 rounded-full bg-emerald-400/70" />
            </>
          )}
        </div>
      </button>

      <div className="sr-only">
        <button type="button" onClick={onMoveUp} disabled={index === 0}>
          Move slide {index + 1} up
        </button>
        <button type="button" onClick={onMoveDown} disabled={index === total - 1}>
          Move slide {index + 1} down
        </button>
      </div>
    </div>
  );
}

interface SlideSidebarProps {
  slides: SlideDraft[];
  activeSlideId: string | null;
  validationBySlideId: Record<string, SlideValidationResult>;
  onSelect: (slideId: string) => void;
  onAddClick: () => void;
  onDuplicate: (slideId: string) => void;
  onDelete: (slideId: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onMoveOffset: (slideId: string, delta: -1 | 1) => void;
}

export function SlideSidebar({
  slides,
  activeSlideId,
  validationBySlideId,
  onSelect,
  onAddClick,
  onDuplicate,
  onDelete,
  onReorder,
  onMoveOffset,
}: SlideSidebarProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  return (
    <aside
      aria-label="Slides"
      className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-100/70 p-3"
    >
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {slides.map((slide, idx) => (
              <SortableSlideItem
                key={slide.id}
                slide={slide}
                index={idx}
                total={slides.length}
                isActive={slide.id === activeSlideId}
                isValid={validationBySlideId[slide.id]?.valid ?? false}
                onSelect={() => onSelect(slide.id)}
                onDuplicate={() => onDuplicate(slide.id)}
                onDelete={() => onDelete(slide.id)}
                onMoveUp={() => onMoveOffset(slide.id, -1)}
                onMoveDown={() => onMoveOffset(slide.id, 1)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {activeSlideId && slides.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1 border-t border-slate-200 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Move selected slide up"
            onClick={() => onMoveOffset(activeSlideId, -1)}
            disabled={slides[0]?.id === activeSlideId}
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Move selected slide down"
            onClick={() => onMoveOffset(activeSlideId, 1)}
            disabled={slides[slides.length - 1]?.id === activeSlideId}
          >
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      <div className="pt-3">
        <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={onAddClick}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('creator.addSlide').replace(/^\+\s*/, '')}
        </Button>
      </div>
    </aside>
  );
}

