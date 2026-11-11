import {
  BarChart2,
  CheckSquare,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  ListChecks,
  MessageSquare,
  Quote,
  Sliders,
  Sparkles,
  Target,
  Type,
  UploadCloud,
  Video,
} from 'lucide-react';
import type { ComponentType } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/cn';
import type { SlideType } from '@shared/schemas/slide';

interface SlideTypeCard {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  slideType?: SlideType;
  releaseBadge?: 'R3';
}

const TEST_KNOWLEDGE_TYPES: SlideTypeCard[] = [
  {
    id: 'quiz',
    label: 'Quiz',
    description: '2–6 answer options (single or multi-select)',
    icon: ListChecks,
    slideType: 'quiz',
  },
  {
    id: 'true_false',
    label: 'True or false',
    description: '2 fixed choices',
    icon: CheckSquare,
    slideType: 'true_false',
  },
  {
    id: 'type_answer',
    label: 'Type answer',
    description: 'Short typed text match',
    icon: Type,
    slideType: 'type_answer',
  },
  {
    id: 'slider',
    label: 'Slider',
    description: 'Numeric range estimate',
    icon: Sliders,
    slideType: 'slider',
  },
  {
    id: 'puzzle',
    label: 'Puzzle',
    description: 'Order 4 items in sequence',
    icon: HelpCircle,
    slideType: 'puzzle',
  },
  {
    id: 'pin_answer',
    label: 'Pin answer',
    description: 'Drop pin on target region',
    icon: Target,
    releaseBadge: 'R3',
  },
];

const COLLECT_OPINIONS_TYPES: SlideTypeCard[] = [
  {
    id: 'poll',
    label: 'Poll',
    description: '2–4 options, no right answer',
    icon: BarChart2,
    slideType: 'poll',
  },
  {
    id: 'scale',
    label: 'Scale',
    description: '1–5 rating scale',
    icon: Sliders,
    slideType: 'scale',
  },
  {
    id: 'nps_scale',
    label: 'NPS scale',
    description: '0–10 net promoter score',
    icon: BarChart2,
    slideType: 'nps_scale',
  },
  {
    id: 'word_cloud',
    label: 'Word cloud',
    description: 'Short phrases word cloud',
    icon: Sparkles,
    slideType: 'word_cloud',
  },
  {
    id: 'open_ended',
    label: 'Open-ended',
    description: 'Free text up to 250 chars',
    icon: MessageSquare,
    slideType: 'open_ended',
  },
  {
    id: 'drop_pin',
    label: 'Drop pin',
    description: 'Image pin heatmap',
    icon: Target,
    releaseBadge: 'R3',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    description: 'Submit & upvote ideas',
    icon: MessageSquare,
    releaseBadge: 'R3',
  },
];

const MEDIA_SLIDE_TYPES: SlideTypeCard[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Heading, body text & image',
    icon: FileText,
    slideType: 'classic',
  },
  {
    id: 'big_title',
    label: 'Big title',
    description: 'Section title card',
    icon: Type,
    slideType: 'big_title',
  },
  {
    id: 'title_text',
    label: 'Title and text',
    description: 'Structured explanation',
    icon: FileText,
    slideType: 'title_text',
  },
  {
    id: 'bullet_points',
    label: 'Bullet points',
    description: 'Key takeaways list',
    icon: ListChecks,
    slideType: 'bullet_points',
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Featured quote & author',
    icon: Quote,
    slideType: 'quote',
  },
  {
    id: 'big_media',
    label: 'Big media',
    description: 'Full-canvas visual',
    icon: ImageIcon,
    slideType: 'big_media',
  },
  {
    id: 'video',
    label: 'Video',
    description: 'YouTube or Vimeo embed',
    icon: Video,
    slideType: 'video',
  },
];

interface AddSlideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: SlideType) => void;
}

function SlideTypeGroup({
  title,
  items,
  onSelectType,
}: {
  title: string;
  items: SlideTypeCard[];
  onSelectType: (type: SlideType) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const enabled = Boolean(item.slideType);
          return (
            <button
              key={item.id}
              type="button"
              disabled={!enabled}
              onClick={() => item.slideType && onSelectType(item.slideType)}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                enabled
                  ? 'border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/40'
                  : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-65'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  enabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                  {item.releaseBadge && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                      {item.releaseBadge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AddSlideModal({ open, onOpenChange, onSelectType }: AddSlideModalProps) {
  function handlePick(type: SlideType) {
    onSelectType(type);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add slide</DialogTitle>
          <DialogDescription>
            Choose a slide type, search the question bank, or import from a spreadsheet.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="add" className="mt-3">
          <TabsList className="grid w-full max-w-sm grid-cols-3">
            <TabsTrigger value="add">Add</TabsTrigger>
            <TabsTrigger value="find">Find</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-5 pt-2">
            <SlideTypeGroup
              title="Test knowledge"
              items={TEST_KNOWLEDGE_TYPES}
              onSelectType={handlePick}
            />
            <SlideTypeGroup
              title="Collect opinions"
              items={COLLECT_OPINIONS_TYPES}
              onSelectType={handlePick}
            />
            <SlideTypeGroup
              title="Media slides"
              items={MEDIA_SLIDE_TYPES}
              onSelectType={handlePick}
            />
          </TabsContent>

          <TabsContent value="find" className="py-8 text-center">
            <p className="text-sm font-semibold text-slate-800">Question bank search (Unit U7)</p>
            <p className="mt-1 text-xs text-slate-600">
              Search and insert questions from public Eroot quizzes in Unit U7.
            </p>
          </TabsContent>

          <TabsContent value="import" className="py-8 text-center">
            <UploadCloud className="mx-auto mb-2 h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-800">
              Spreadsheet import (.xlsx / .csv) (Unit U7)
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Downloadable template and bulk question importer arrive in Unit U7.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
