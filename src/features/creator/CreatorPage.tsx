import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import { fetchQuizWithSlides, saveQuizAndSlides, uploadQuizMedia } from './api';
import { AddSlideModal } from './components/AddSlideModal';
import { CreatorPreviewModal } from './components/CreatorPreviewModal';
import { CreatorTopBar } from './components/CreatorTopBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { SlideCanvas } from './components/SlideCanvas';
import { SlideSidebar } from './components/SlideSidebar';
import { useCreatorStore } from './store';

export function CreatorPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addSlideOpen, setAddSlideOpen] = useState(false);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);

  const quiz = useCreatorStore((s) => s.quiz);
  const slides = useCreatorStore((s) => s.slides);
  const activeSlideId = useCreatorStore((s) => s.activeSlideId);
  const saveStatus = useCreatorStore((s) => s.saveStatus);
  const validation = useCreatorStore((s) => s.validation);

  const hydrate = useCreatorStore((s) => s.hydrate);
  const setActiveSlide = useCreatorStore((s) => s.setActiveSlide);
  const updateQuizMeta = useCreatorStore((s) => s.updateQuizMeta);
  const updateSlide = useCreatorStore((s) => s.updateSlide);
  const addSlide = useCreatorStore((s) => s.addSlide);
  const duplicateSlide = useCreatorStore((s) => s.duplicateSlide);
  const deleteSlide = useCreatorStore((s) => s.deleteSlide);
  const reorderSlides = useCreatorStore((s) => s.reorderSlides);
  const moveSlideByOffset = useCreatorStore((s) => s.moveSlideByOffset);
  const changeSlideType = useCreatorStore((s) => s.changeSlideType);
  const applyTimeLimitToAll = useCreatorStore((s) => s.applyTimeLimitToAll);
  const setPointsMode = useCreatorStore((s) => s.setPointsMode);
  const setSaveStatus = useCreatorStore((s) => s.setSaveStatus);

  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!quizId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetchQuizWithSlides(quizId);
        if (!active) return;
        if (!res) {
          setNotFound(true);
        } else {
          hydrate(res.quiz, res.slides);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [quizId, hydrate]);

  const persistNow = useCallback(
    async (publish = false) => {
      const currentQuiz = useCreatorStore.getState().quiz;
      const currentSlides = useCreatorStore.getState().slides;
      if (!currentQuiz) return;

      setSaveStatus('saving');
      try {
        const res = await saveQuizAndSlides(currentQuiz, currentSlides, { publish });
        useCreatorStore.setState((prev) => ({
          quiz: prev.quiz
            ? { ...prev.quiz, isValid: res.isValid, isPublished: res.isPublished }
            : null,
          saveStatus: 'saved',
          saveError: null,
        }));
      } catch (err) {
        setSaveStatus('error', err instanceof Error ? err.message : 'Failed to save');
      }
    },
    [setSaveStatus]
  );

  // Debounced 800ms autosave on dirty changes
  useEffect(() => {
    if (saveStatus !== 'dirty') return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void persistNow(false);
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [saveStatus, quiz, slides, persistNow]);

  async function handleSavePublish() {
    setPublishNotice(null);
    if (!validation.valid && validation.firstInvalidSlideId) {
      setActiveSlide(validation.firstInvalidSlideId);
      setPublishNotice(t('creator.validation.invalidPublish'));
      return;
    }
    await persistNow(true);
    setPublishNotice('Quiz saved and ready to host.');
  }

  async function handleUploadImage(file: File): Promise<string> {
    if (!user || !quiz) {
      throw new Error('Authentication required to upload media.');
    }
    return uploadQuizMedia(user.id, quiz.id, file);
  }

  if (loading) {
    return (
      <div
        role="status"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-700"
      >
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" aria-hidden="true" />
        <p className="text-sm font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  if (notFound || !quiz) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <Alert variant="error" title="Quiz not found">
          This quiz does not exist or you do not have permission to edit it.
        </Alert>
        <Button asChild>
          <Link to="/library">Back to Library</Link>
        </Button>
      </main>
    );
  }

  const activeSlideIndex = Math.max(
    0,
    slides.findIndex((s) => s.id === activeSlideId)
  );
  const activeSlide = slides[activeSlideIndex] ?? slides[0];

  if (!activeSlide) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <CreatorTopBar
        title={quiz.title}
        saveStatus={saveStatus}
        onTitleChange={(title) => updateQuizMeta({ title })}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPreview={() => setPreviewOpen(true)}
        onSavePublish={() => void handleSavePublish()}
        onRetrySave={() => void persistNow(false)}
      />

      {publishNotice && (
        <div className="border-b border-violet-200 bg-violet-50 px-4 py-2 text-center text-xs font-semibold text-violet-900">
          {publishNotice}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SlideSidebar
          slides={slides}
          activeSlideId={activeSlide.id}
          validationBySlideId={validation.bySlideId}
          onSelect={setActiveSlide}
          onAddClick={() => setAddSlideOpen(true)}
          onDuplicate={duplicateSlide}
          onDelete={deleteSlide}
          onReorder={reorderSlides}
          onMoveOffset={moveSlideByOffset}
        />

        <SlideCanvas
          slide={activeSlide}
          themeId={quiz.themeId}
          validation={validation.bySlideId[activeSlide.id]}
          onUpdateSlide={(updater) => updateSlide(activeSlide.id, updater)}
          onUploadImage={handleUploadImage}
        />

        <PropertiesPanel
          slide={activeSlide}
          totalSlides={slides.length}
          selectedThemeId={quiz.themeId}
          onChangeType={(nextType) => changeSlideType(activeSlide.id, nextType)}
          onChangeTimeLimit={(timeLimit) =>
            updateSlide(activeSlide.id, (s) => ({ ...s, timeLimit }))
          }
          onApplyTimeLimitToAll={applyTimeLimitToAll}
          onChangePointsMode={(mode) => setPointsMode(activeSlide.id, mode)}
          onSelectTheme={(themeId) => updateQuizMeta({ themeId })}
          onDuplicateSlide={() => duplicateSlide(activeSlide.id)}
          onDeleteSlide={() => deleteSlide(activeSlide.id)}
        />
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        quiz={quiz}
        onApplySettings={updateQuizMeta}
        onUploadCover={handleUploadImage}
      />

      <CreatorPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        quizTitle={quiz.title}
        themeId={quiz.themeId}
        slides={slides}
        initialIndex={activeSlideIndex}
      />

      <AddSlideModal
        open={addSlideOpen}
        onOpenChange={setAddSlideOpen}
        onSelectType={(slideType) => addSlide(slideType)}
      />
    </div>
  );
}

