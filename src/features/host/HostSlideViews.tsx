import { AnswerTile } from '@/components/eroot/AnswerTile';
import { getAnswerTileTheme } from '@shared/constants/answer-tiles';
import type { RevealPayload } from '@shared/schemas/game';
import type { PublicSlide } from '@shared/schemas/sanitizer';
import { cn } from '@/lib/cn';

export function HostActiveSlideView({
  slide,
  revealProgress = 1,
}: {
  slide: PublicSlide;
  revealProgress?: number;
}) {
  const blurPx = slide.mediaReveal ? Math.max(0, Math.round((1 - revealProgress) * 18)) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 text-center text-slate-900 shadow-xl">
        <h1 className="font-display text-2xl font-extrabold sm:text-4xl">{slide.title}</h1>
        {slide.subtitle && <p className="mt-2 text-lg text-slate-600">{slide.subtitle}</p>}
      </div>

      {slide.mediaUrl && (
        <div className="flex justify-center">
          <img
            src={slide.mediaUrl}
            alt="Question visual"
            style={blurPx > 0 ? { filter: `blur(${blurPx}px)` } : undefined}
            className="max-h-64 rounded-2xl bg-white/10 object-contain p-1 transition-[filter] duration-300"
          />
        </div>
      )}

      {slide.type === 'video' && slide.embedUrl && (
        <div className="mx-auto max-w-2xl aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
          <iframe
            src={slide.embedUrl}
            title={slide.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {(slide.type === 'classic' || slide.type === 'title_text') && (
        <div className="rounded-3xl bg-white/95 p-8 text-center text-slate-800 shadow-lg">
          <p className="whitespace-pre-line text-xl leading-relaxed">{slide.body}</p>
        </div>
      )}

      {slide.type === 'bullet_points' && (
        <ul className="mx-auto max-w-2xl list-disc space-y-3 rounded-3xl bg-white/95 p-8 pl-12 text-left text-slate-900 shadow-lg">
          {(slide.bullets ?? []).map((b, i) => (
            <li key={i} className="text-xl font-semibold">
              {b}
            </li>
          ))}
        </ul>
      )}

      {slide.type === 'quote' && (
        <blockquote className="rounded-3xl bg-white/95 p-8 text-center text-slate-900 shadow-lg space-y-3">
          <p className="text-2xl italic font-bold">&ldquo;{slide.quote}&rdquo;</p>
          {slide.author && <footer className="text-base font-semibold text-slate-600">— {slide.author}</footer>}
        </blockquote>
      )}

      {slide.type === 'big_media' && slide.caption && (
        <p className="text-center text-xl font-semibold text-white">{slide.caption}</p>
      )}

      {(slide.type === 'quiz' || slide.type === 'true_false' || slide.type === 'poll') && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {slide.options.map((opt, idx) => (
            <AnswerTile
              key={opt.id}
              index={idx}
              label={opt.text}
              imageUrl={opt.imageUrl}
              interactive={false}
            />
          ))}
        </div>
      )}

      {slide.type === 'type_answer' && (
        <div className="rounded-2xl bg-white/15 p-6 text-center text-lg font-semibold">
          Players are typing their short answer...
        </div>
      )}

      {slide.type === 'slider' && slide.sliderConfig && (
        <div className="rounded-2xl bg-white/15 p-6 text-center text-lg font-semibold">
          Range: {slide.sliderConfig.min} to {slide.sliderConfig.max} {slide.sliderConfig.unit}
        </div>
      )}

      {slide.type === 'puzzle' && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(slide.puzzleItems ?? []).map((item, idx) => (
            <div
              key={item.id}
              className="rounded-xl bg-white/95 px-4 py-3 text-base font-bold text-slate-900 shadow"
            >
              {idx + 1}. {item.text}
            </div>
          ))}
        </div>
      )}

      {(slide.type === 'scale' || slide.type === 'nps_scale') && slide.scaleConfig && (
        <div className="rounded-2xl bg-white/15 p-6 text-center space-y-2">
          <p className="text-lg font-bold">
            Scale {slide.scaleConfig.min} – {slide.scaleConfig.max}
          </p>
          <div className="flex justify-between text-sm opacity-90 max-w-md mx-auto">
            <span>{slide.scaleConfig.minLabel}</span>
            <span>{slide.scaleConfig.maxLabel}</span>
          </div>
        </div>
      )}

      {(slide.type === 'word_cloud' || slide.type === 'open_ended') && (
        <div className="rounded-2xl bg-white/15 p-6 text-center text-lg font-semibold">
          Waiting for player submissions...
        </div>
      )}
    </div>
  );
}

export function HostRevealSlideView({
  slide,
  reveal,
}: {
  slide: PublicSlide;
  reveal: RevealPayload;
}) {
  if (slide.type === 'quiz' || slide.type === 'true_false' || slide.type === 'poll') {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white/10 p-6 backdrop-blur-sm space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {slide.options.map((opt, idx) => {
              const tileTheme = getAnswerTileTheme(idx);
              const count = reveal.optionCounts[opt.id] ?? 0;
              const total = Math.max(1, reveal.totalAnswers);
              const pct = Math.round((count / total) * 100);
              const isCorrect =
                slide.type !== 'poll' && reveal.correctOptionIds.includes(opt.id);

              return (
                <div key={opt.id} className="flex flex-col items-center gap-2">
                  <span className="text-sm font-extrabold">
                    {count} ({pct}%)
                  </span>
                  <div className="flex h-32 w-full items-end rounded-xl bg-black/25 p-1.5">
                    <div
                      style={{
                        height: `${Math.max(8, pct)}%`,
                        backgroundColor: tileTheme.bgHex,
                      }}
                      className={cn(
                        'w-full rounded-lg transition-all duration-500',
                        isCorrect && 'ring-2 ring-white'
                      )}
                    />
                  </div>
                  <span className="text-xs font-bold uppercase">{tileTheme.letter}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {slide.options.map((opt, idx) => (
            <AnswerTile
              key={opt.id}
              index={idx}
              label={opt.text}
              imageUrl={opt.imageUrl}
              interactive={false}
              revealed={slide.type !== 'poll'}
              isCorrect={
                slide.type === 'poll' ? undefined : reveal.correctOptionIds.includes(opt.id)
              }
            />
          ))}
        </div>
      </div>
    );
  }

  if (slide.type === 'type_answer') {
    return (
      <div className="space-y-4 rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
        <h2 className="text-lg font-bold text-emerald-700">Accepted answers</h2>
        <div className="flex flex-wrap gap-2">
          {(reveal.acceptedAnswers ?? []).map((ans, idx) => (
            <span
              key={idx}
              className="rounded-full bg-emerald-100 px-4 py-1.5 text-base font-extrabold text-emerald-900"
            >
              {ans}
            </span>
          ))}
        </div>
        {(reveal.wordCounts ?? []).length > 0 && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-600">Top player answers:</p>
            <div className="flex flex-wrap gap-2">
              {reveal.wordCounts!.slice(0, 10).map((w) => (
                <span key={w.word} className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold">
                  {w.word} ({w.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (slide.type === 'slider' && reveal.sliderTarget) {
    return (
      <div className="rounded-3xl bg-white p-7 text-center text-slate-900 shadow-xl space-y-3">
        <p className="text-sm font-bold uppercase text-indigo-600">Target answer</p>
        <p className="font-display text-4xl font-black text-emerald-700">
          {reveal.sliderTarget.correctValue} {reveal.sliderTarget.unit}
        </p>
        <p className="text-sm text-slate-600">
          Accepted tolerance: +/- {reveal.sliderTarget.tolerance} {reveal.sliderTarget.unit}
        </p>
        {typeof reveal.scaleMean === 'number' && (
          <p className="text-base font-bold text-slate-800">
            Average player estimate: {reveal.scaleMean} {reveal.sliderTarget.unit}
          </p>
        )}
      </div>
    );
  }

  if (slide.type === 'puzzle' && reveal.puzzleSequence) {
    return (
      <div className="space-y-3 rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
        <h2 className="text-lg font-bold text-emerald-700">Correct sequence</h2>
        {reveal.puzzleSequence.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 font-bold text-emerald-950"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
              {idx + 1}
            </span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    );
  }

  if ((slide.type === 'scale' || slide.type === 'nps_scale') && slide.scaleConfig) {
    const values: number[] = [];
    for (let v = slide.scaleConfig.min; v <= slide.scaleConfig.max; v++) {
      values.push(v);
    }
    const counts = reveal.numericCounts ?? {};
    const total = Math.max(1, reveal.totalAnswers);

    return (
      <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {slide.type === 'nps_scale' && typeof reveal.npsScore === 'number' && (
            <div className="rounded-2xl bg-indigo-50 px-5 py-3">
              <p className="text-xs font-bold uppercase text-indigo-700">Net Promoter Score</p>
              <p className="font-display text-3xl font-black text-indigo-950">
                {reveal.npsScore}
              </p>
            </div>
          )}
          {typeof reveal.scaleMean === 'number' && (
            <div className="rounded-2xl bg-indigo-50 px-5 py-3">
              <p className="text-xs font-bold uppercase text-indigo-700">Average rating</p>
              <p className="font-display text-3xl font-black text-indigo-950">{reveal.scaleMean}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-11 gap-2 items-end h-36">
          {values.map((v) => {
            const count = counts[String(v)] ?? 0;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={v} className="flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-xs font-bold text-slate-700">{count}</span>
                <div className="w-full bg-slate-100 rounded-md flex items-end h-24">
                  <div
                    style={{ height: `${Math.max(8, pct)}%` }}
                    className="w-full rounded-md bg-indigo-600"
                  />
                </div>
                <span className="text-xs font-bold text-slate-800">{v}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (slide.type === 'word_cloud') {
    const words = reveal.wordCounts ?? [];
    const maxCount = Math.max(1, words[0]?.count ?? 1);
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-900 shadow-xl">
        {words.length === 0 ? (
          <p className="text-slate-600">No responses submitted.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {words.map((w, idx) => {
              const scale = 1 + (w.count / maxCount) * 1.4;
              return (
                <span
                  key={w.word}
                  style={{ fontSize: `${scale}rem` }}
                  className={cn(
                    'font-display font-black leading-tight',
                    idx % 3 === 0
                      ? 'text-indigo-700'
                      : idx % 3 === 1
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                  )}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (slide.type === 'open_ended') {
    const responses = reveal.openResponses ?? [];
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {responses.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white p-6 text-center text-slate-600">
            No responses submitted.
          </div>
        ) : (
          responses.map((r, idx) => (
            <div key={idx} className="rounded-2xl bg-white p-4 text-slate-900 shadow-md">
              <p className="text-base font-semibold">&ldquo;{r.text}&rdquo;</p>
              {r.nickname && (
                <p className="mt-2 text-xs font-bold text-indigo-700">— {r.nickname}</p>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  return null;
}

