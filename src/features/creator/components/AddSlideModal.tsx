import { useEffect, useRef, useState } from 'react';
import {
  BarChart2,
  CheckSquare,
  Download,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  ListChecks,
  MessageSquare,
  Plus,
  Quote,
  Search,
  Sliders,
  Sparkles,
  Target,
  Type,
  UploadCloud,
  Video,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { searchQuestionBank, type QuestionBankHit } from '@/features/creator/api';
import { cn } from '@/lib/cn';
import {
  buildImportTemplateCsv,
  parseCsvText,
  parseImportedGrid,
  TEMPLATE_SAMPLE_ROWS,
  type ImportParseResult,
} from '@shared/import/spreadsheet';
import type { SlideDraft, SlideType } from '@shared/schemas/slide';

interface SlideTypeCard {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  slideType?: SlideType;
  releaseBadge?: 'R3';
}

const TEST_KNOWLEDGE_TYPES: SlideTypeCard[] = [
  { id: 'quiz', label: 'Quiz', description: '2–6 answer options (single or multi-select)', icon: ListChecks, slideType: 'quiz' },
  { id: 'true_false', label: 'True or false', description: '2 fixed choices', icon: CheckSquare, slideType: 'true_false' },
  { id: 'type_answer', label: 'Type answer', description: 'Short typed text match', icon: Type, slideType: 'type_answer' },
  { id: 'slider', label: 'Slider', description: 'Numeric range estimate', icon: Sliders, slideType: 'slider' },
  { id: 'puzzle', label: 'Puzzle', description: 'Order 4 items in sequence', icon: HelpCircle, slideType: 'puzzle' },
  { id: 'pin_answer', label: 'Pin answer', description: 'Drop pin on target region', icon: Target, slideType: 'pin_answer' },
];

const COLLECT_OPINIONS_TYPES: SlideTypeCard[] = [
  { id: 'poll', label: 'Poll', description: '2–4 options, no right answer', icon: BarChart2, slideType: 'poll' },
  { id: 'scale', label: 'Scale', description: '1–5 rating scale', icon: Sliders, slideType: 'scale' },
  { id: 'nps_scale', label: 'NPS scale', description: '0–10 net promoter score', icon: BarChart2, slideType: 'nps_scale' },
  { id: 'word_cloud', label: 'Word cloud', description: 'Short phrases word cloud', icon: Sparkles, slideType: 'word_cloud' },
  { id: 'open_ended', label: 'Open-ended', description: 'Free text up to 250 chars', icon: MessageSquare, slideType: 'open_ended' },
  { id: 'drop_pin', label: 'Drop pin', description: 'Image pin heatmap', icon: Target, slideType: 'drop_pin' },
  { id: 'brainstorm', label: 'Brainstorm', description: 'Submit & upvote ideas', icon: MessageSquare, slideType: 'brainstorm' },
];

const MEDIA_SLIDE_TYPES: SlideTypeCard[] = [
  { id: 'classic', label: 'Classic', description: 'Heading, body text & image', icon: FileText, slideType: 'classic' },
  { id: 'big_title', label: 'Big title', description: 'Section title card', icon: Type, slideType: 'big_title' },
  { id: 'title_text', label: 'Title and text', description: 'Structured explanation', icon: FileText, slideType: 'title_text' },
  { id: 'bullet_points', label: 'Bullet points', description: 'Key takeaways list', icon: ListChecks, slideType: 'bullet_points' },
  { id: 'quote', label: 'Quote', description: 'Featured quote & author', icon: Quote, slideType: 'quote' },
  { id: 'big_media', label: 'Big media', description: 'Full-canvas visual', icon: ImageIcon, slideType: 'big_media' },
  { id: 'video', label: 'Video', description: 'YouTube or Vimeo embed', icon: Video, slideType: 'video' },
];

interface AddSlideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId?: string;
  onSelectType: (type: SlideType) => void;
  onInsertSlides?: (slides: SlideDraft[]) => void;
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

export function AddSlideModal({
  open,
  onOpenChange,
  quizId = 'draft',
  onSelectType,
  onInsertSlides,
}: AddSlideModalProps) {
  const [bankQuery, setBankQuery] = useState('');
  const [bankHits, setBankHits] = useState<QuestionBankHit[]>([]);
  const [searchingBank, setSearchingBank] = useState(false);

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importPreview, setImportPreview] = useState<ImportParseResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsingImport, setParsingImport] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setSearchingBank(true);
    const timer = window.setTimeout(() => {
      searchQuestionBank(bankQuery)
        .then((hits) => {
          if (active) setBankHits(hits);
        })
        .catch(() => {
          if (active) setBankHits([]);
        })
        .finally(() => {
          if (active) setSearchingBank(false);
        });
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, bankQuery]);

  function handlePick(type: SlideType) {
    onSelectType(type);
    onOpenChange(false);
  }

  function handleDownloadCsvTemplate() {
    const csv = buildImportTemplateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eroot-import-template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadXlsxTemplate() {
    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Questions');
    for (const row of TEMPLATE_SAMPLE_ROWS) {
      sheet.addRow(row);
    }
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eroot-import-template.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setImportError('Spreadsheet file must be 2 MB or smaller.');
      return;
    }
    setImportError(null);
    setParsingImport(true);
    try {
      let grid: string[][] = [];
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        grid = parseCsvText(text);
      } else if (file.name.toLowerCase().endsWith('.xlsx')) {
        const ExcelJS = await import('exceljs');
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(await file.arrayBuffer());
        const sheet = wb.worksheets[0];
        if (sheet) {
          sheet.eachRow((row) => {
            const values = (row.values as unknown[]).slice(1).map((v) =>
              v === null || v === undefined ? '' : String(v).trim()
            );
            if (values.some(Boolean)) {
              grid.push(values);
            }
          });
        }
      } else {
        setImportError('Please upload a .xlsx or .csv spreadsheet.');
        setParsingImport(false);
        return;
      }

      setImportPreview(parseImportedGrid(quizId, grid));
    } catch {
      setImportError('Could not read spreadsheet. Check the template format.');
    } finally {
      setParsingImport(false);
    }
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
            <SlideTypeGroup title="Test knowledge" items={TEST_KNOWLEDGE_TYPES} onSelectType={handlePick} />
            <SlideTypeGroup title="Collect opinions" items={COLLECT_OPINIONS_TYPES} onSelectType={handlePick} />
            <SlideTypeGroup title="Media slides" items={MEDIA_SLIDE_TYPES} onSelectType={handlePick} />
          </TabsContent>

          <TabsContent value="find" className="space-y-4 pt-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                aria-label="Search question bank"
                placeholder="Search public quizzes & templates by keyword..."
                value={bankQuery}
                onChange={(e) => setBankQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {searchingBank ? (
                <p className="py-6 text-center text-sm text-slate-500">Searching questions...</p>
              ) : bankHits.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No matching questions found.
                </p>
              ) : (
                bankHits.map((hit, idx) => (
                  <div
                    key={`${hit.slide.id}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {hit.slide.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {hit.slide.type} · {hit.sourceTitle}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onInsertSlides?.([hit.slide]);
                        onOpenChange(false);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Insert
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-slate-900">1. Download template</p>
                <p className="text-xs text-slate-600">
                  Supports Quiz, True or false, and Poll rows (up to 100 questions).
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={handleDownloadCsvTemplate}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  .CSV Template
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void handleDownloadXlsxTemplate()}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  .XLSX Template
                </Button>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center space-y-3">
              <UploadCloud className="mx-auto h-8 w-8 text-indigo-500" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-900">
                2. Upload completed .xlsx or .csv file
              </p>
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="sr-only"
                onChange={(e) => void handleFileSelected(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={parsingImport}
                onClick={() => importInputRef.current?.click()}
              >
                Choose spreadsheet
              </Button>
            </div>

            {importError && <Alert variant="error">{importError}</Alert>}

            {importPreview && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    {importPreview.validSlides.length} valid question(s) ready to import
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    disabled={importPreview.validSlides.length === 0}
                    onClick={() => {
                      onInsertSlides?.(importPreview.validSlides);
                      setImportPreview(null);
                      onOpenChange(false);
                    }}
                  >
                    Import {importPreview.validSlides.length} questions
                  </Button>
                </div>

                {importPreview.errors.length > 0 && (
                  <div className="space-y-1 text-xs text-red-700">
                    {importPreview.errors.map((err, i) => (
                      <p key={i}>
                        Row {err.rowNumber}: {err.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
