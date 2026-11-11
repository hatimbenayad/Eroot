import { createDefaultSlide, type PollContent, type QuizContent, type SlideDraft } from '../schemas/slide';

export interface StarterTemplate {
  id: string;
  title: string;
  description: string;
  subject: string;
  tags: string[];
  themeId: string;
  language: string;
  buildSlides: (quizId: string) => SlideDraft[];
}

function makeQuizSlide(
  quizId: string,
  pos: number,
  title: string,
  options: { text: string; isCorrect: boolean }[],
  timeLimit: 10 | 20 | 30 = 20
): SlideDraft {
  const slide = createDefaultSlide(quizId, pos, 'quiz');
  slide.title = title;
  slide.timeLimit = timeLimit;
  const content = slide.content as QuizContent;
  content.options = options.map((opt, idx) => ({
    id: content.options[idx]?.id ?? `opt_${pos}_${idx}`,
    text: opt.text,
    isCorrect: opt.isCorrect,
  }));
  return slide;
}

function makeTrueFalseSlide(
  quizId: string,
  pos: number,
  title: string,
  answerIsTrue: boolean
): SlideDraft {
  const slide = createDefaultSlide(quizId, pos, 'true_false');
  slide.title = title;
  const content = slide.content as QuizContent;
  content.options[0]!.isCorrect = answerIsTrue;
  content.options[1]!.isCorrect = !answerIsTrue;
  return slide;
}

function makePollSlide(
  quizId: string,
  pos: number,
  title: string,
  choices: string[]
): SlideDraft {
  const slide = createDefaultSlide(quizId, pos, 'poll');
  slide.title = title;
  const content = slide.content as PollContent;
  content.options = choices.map((text, idx) => ({
    id: content.options[idx]?.id ?? `poll_${pos}_${idx}`,
    text,
  }));
  return slide;
}

export const STARTER_TEMPLATES: readonly StarterTemplate[] = [
  {
    id: 'tpl-icebreaker',
    title: 'Team Icebreaker',
    description: 'Warm up a workshop or class with quick opinion polls and a word cloud.',
    subject: 'Team Building',
    tags: ['icebreaker', 'warmup', 'meeting'],
    themeId: 'ocean-current',
    language: 'en',
    buildSlides: (quizId) => [
      makePollSlide(quizId, 0, 'How is your energy level today?', [
        'Ready to go!',
        'Need more coffee',
        'Steady',
        'Ask me in an hour',
      ]),
      makePollSlide(quizId, 1, 'If you could work from anywhere for a week, where?', [
        'Mountain cabin',
        'Beach town',
        'Bustling city',
        'Home desk',
      ]),
      (() => {
        const wc = createDefaultSlide(quizId, 2, 'word_cloud');
        wc.title = 'One word describing your current week';
        return wc;
      })(),
    ],
  },
  {
    id: 'tpl-pub-quiz',
    title: 'Pub Quiz Night',
    description: 'Classic general-knowledge trivia mix for friends and events.',
    subject: 'General Knowledge',
    tags: ['trivia', 'pub', 'geography'],
    themeId: 'indigo-stage',
    language: 'en',
    buildSlides: (quizId) => [
      makeQuizSlide(quizId, 0, 'Which planet has the most confirmed moons?', [
        { text: 'Saturn', isCorrect: true },
        { text: 'Jupiter', isCorrect: false },
        { text: 'Uranus', isCorrect: false },
        { text: 'Neptune', isCorrect: false },
      ]),
      makeTrueFalseSlide(quizId, 1, 'Honey never spoils when sealed properly.', true),
      makeQuizSlide(quizId, 2, 'What is the capital city of Australia?', [
        { text: 'Sydney', isCorrect: false },
        { text: 'Canberra', isCorrect: true },
        { text: 'Melbourne', isCorrect: false },
        { text: 'Brisbane', isCorrect: false },
      ]),
    ],
  },
  {
    id: 'tpl-class-review',
    title: 'Class Review Check',
    description: 'Check comprehension with Quiz, Type Answer, and ordering Puzzle slides.',
    subject: 'Education',
    tags: ['classroom', 'review', 'formative'],
    themeId: 'emerald-forest',
    language: 'en',
    buildSlides: (quizId) => [
      makeQuizSlide(quizId, 0, 'Which gas makes up ~78% of Earth’s atmosphere?', [
        { text: 'Nitrogen', isCorrect: true },
        { text: 'Oxygen', isCorrect: false },
        { text: 'Carbon dioxide', isCorrect: false },
        { text: 'Argon', isCorrect: false },
      ]),
      (() => {
        const ta = createDefaultSlide(quizId, 1, 'type_answer');
        ta.title = 'What is the chemical symbol for Gold?';
        ta.content = { acceptedAnswers: ['Au'] };
        return ta;
      })(),
      (() => {
        const pz = createDefaultSlide(quizId, 2, 'puzzle');
        pz.title = 'Order water cycle stages starting from evaporation';
        pz.content = {
          items: [
            { id: 'st1', text: 'Evaporation' },
            { id: 'st2', text: 'Condensation' },
            { id: 'st3', text: 'Precipitation' },
            { id: 'st4', text: 'Collection' },
          ],
        };
        return pz;
      })(),
    ],
  },
  {
    id: 'tpl-team-checkin',
    title: 'Sprint & Team Check-in',
    description: 'Collect structured sprint feedback using Scale, NPS, and Open-ended slides.',
    subject: 'Retrospective',
    tags: ['retro', 'agile', 'feedback'],
    themeId: 'royal-plum',
    language: 'en',
    buildSlides: (quizId) => [
      (() => {
        const sc = createDefaultSlide(quizId, 0, 'scale');
        sc.title = 'Our goals this sprint felt clear and achievable';
        return sc;
      })(),
      (() => {
        const nps = createDefaultSlide(quizId, 1, 'nps_scale');
        nps.title = 'How satisfied are you with our current engineering workflow?';
        return nps;
      })(),
      (() => {
        const oe = createDefaultSlide(quizId, 2, 'open_ended');
        oe.title = 'What is one thing we should improve next sprint?';
        return oe;
      })(),
    ],
  },
  {
    id: 'tpl-quick-trivia',
    title: 'Quick Tech & Science Trivia',
    description: 'Fast 10-second rounds covering computing and science basics.',
    subject: 'Technology',
    tags: ['tech', 'science', 'fast'],
    themeId: 'midnight-slate',
    language: 'en',
    buildSlides: (quizId) => [
      makeQuizSlide(
        quizId,
        0,
        'What does HTTP stand for?',
        [
          { text: 'HyperText Transfer Protocol', isCorrect: true },
          { text: 'High Throughput Transport Process', isCorrect: false },
          { text: 'Host Terminal Text Port', isCorrect: false },
          { text: 'Hyperlink Tree Transmission Protocol', isCorrect: false },
        ],
        10
      ),
      makeTrueFalseSlide(quizId, 1, 'Light travels faster in water than in vacuum.', false),
      makeQuizSlide(
        quizId,
        2,
        'How many bits are in a byte?',
        [
          { text: '4', isCorrect: false },
          { text: '8', isCorrect: true },
          { text: '16', isCorrect: false },
          { text: '32', isCorrect: false },
        ],
        10
      ),
    ],
  },
] as const;

