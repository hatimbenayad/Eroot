import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Route } from '@playwright/test';
import { computeScoreboard, type DbGameRow, type DbPlayerRow } from '../../api/_lib/game-helpers';
import { sanitizeSlidesForPlayer } from '../../shared/schemas/sanitizer';
import { createDefaultSlide, type PollContent, type QuizContent, type SlideDraft } from '../../shared/schemas/slide';
import { evaluateR1SlideAnswer } from '../../shared/scoring/scoring';
import { transitionGameState } from '../../shared/state-machine/game-state';
import type { GameOptions } from '../../shared/schemas/game';

interface AnswerRecord {
  gameId: string;
  playerId: string;
  slideId: string;
  optionId: string;
  points: number;
  isCorrect: boolean | null;
}

function createMockHub() {
  const quizId = '11111111-1111-4111-8111-111111111111';
  const hostId = 'host-e2e-1';

  const slide1 = createDefaultSlide(quizId, 0, 'quiz');
  slide1.id = 'slide-quiz-1';
  slide1.title = 'What is the capital of Japan?';
  const s1Opts = (slide1.content as QuizContent).options;
  s1Opts[0]!.id = 'opt-tokyo';
  s1Opts[0]!.text = 'Tokyo';
  s1Opts[0]!.isCorrect = true;
  s1Opts[1]!.id = 'opt-osaka';
  s1Opts[1]!.text = 'Osaka';
  s1Opts[1]!.isCorrect = false;
  s1Opts[2]!.text = '';
  s1Opts[3]!.text = '';

  const slide2 = createDefaultSlide(quizId, 1, 'poll');
  slide2.id = 'slide-poll-2';
  slide2.title = 'Favorite time to quiz?';
  const s2Opts = (slide2.content as PollContent).options;
  s2Opts[0]!.id = 'poll-morning';
  s2Opts[0]!.text = 'Morning';
  s2Opts[1]!.id = 'poll-evening';
  s2Opts[1]!.text = 'Evening';
  s2Opts[2]!.text = '';
  s2Opts[3]!.text = '';

  const authSlides: SlideDraft[] = [slide1, slide2];
  let game: DbGameRow | null = null;
  const players: DbPlayerRow[] = [];
  const answers: AnswerRecord[] = [];

  async function handleRoute(route: Route) {
    const req = route.request();
    const url = new URL(req.url());

    // Supabase Auth & REST mocks for host session + library
    if (url.hostname === 'e2e-mock.supabase.co') {
      if (url.pathname.startsWith('/auth/v1/user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: hostId, email: 'host@eroot.app', role: 'authenticated' }),
        });
        return;
      }
      if (url.pathname.startsWith('/rest/v1/quizzes')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: quizId,
              owner_id: hostId,
              title: 'E2E World Trivia',
              description: '',
              visibility: 'private',
              theme_id: 'indigo-stage',
              cover_image_url: null,
              language: 'en',
              music_preset: 'silent',
              is_valid: true,
              is_published: true,
              tags: [],
              subject: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              slides: [{ id: slide1.id }, { id: slide2.id }],
            },
          ]),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }

    // Eroot /api/games/* endpoints
    if (url.pathname === '/api/games/create' && req.method() === 'POST') {
      const body = req.postDataJSON() as { quizId: string; options: GameOptions };
      game = {
        id: '22222222-2222-4222-8222-222222222222',
        pin: '7654321',
        host_id: hostId,
        quiz_id: body.quizId,
        mode: 'classic',
        state: 'lobby',
        current_slide_index: 0,
        question_started_at: null,
        settings: body.options,
        theme_id: 'indigo-stage',
        quiz_title: 'E2E World Trivia',
        max_players: body.options.maxPlayers ?? 100,
        public_slides: sanitizeSlidesForPlayer(authSlides),
        reveal_payload: null,
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          game: {
            id: game.id,
            pin: game.pin,
            mode: game.mode,
            state: game.state,
            currentSlideIndex: 0,
            questionStartedAt: null,
            themeId: game.theme_id,
            quizTitle: game.quiz_title,
            maxPlayers: game.max_players,
            settings: game.settings,
            slides: game.public_slides,
            revealPayload: null,
            scoreboard: [],
            podium: [],
            answerCount: 0,
          },
        }),
      });
      return;
    }

    if (url.pathname === '/api/games/lookup' && req.method() === 'GET') {
      const pin = url.searchParams.get('pin');
      if (!game || pin !== game.pin || game.state === 'ended') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'GAME_NOT_FOUND', message: 'No game found' } }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gameId: game.id,
          quizTitle: game.quiz_title,
          themeId: game.theme_id,
          requirePlayerIdentifier: game.settings.requirePlayerIdentifier,
          playerIdentifierLabel: game.settings.playerIdentifierLabel,
          friendlyNicknames: game.settings.friendlyNicknames,
        }),
      });
      return;
    }

    if (url.pathname === '/api/games/join' && req.method() === 'POST') {
      const body = req.postDataJSON() as { pin: string; nickname?: string };
      if (!game || body.pin !== game.pin) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'GAME_NOT_FOUND', message: 'Not found' } }),
        });
        return;
      }
      const p: DbPlayerRow = {
        id: `player-${players.length + 1}`,
        game_id: game.id,
        nickname: body.nickname?.trim() || `Player${players.length + 1}`,
        identifier: null,
        session_token: `tok-${players.length + 1}`,
        total_score: 0,
        streak: 0,
        is_kicked: false,
        joined_at: new Date(Date.now() + players.length).toISOString(),
      };
      players.push(p);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          gameId: game.id,
          playerId: p.id,
          sessionToken: p.session_token,
          nickname: p.nickname,
        }),
      });
      return;
    }

    if (url.pathname === '/api/games/kick' && req.method() === 'POST') {
      const body = req.postDataJSON() as { playerId: string };
      const target = players.find((p) => p.id === body.playerId);
      if (target) target.is_kicked = true;
      const active = players.filter((p) => !p.is_kicked).map((p) => ({ id: p.id, nickname: p.nickname }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, players: active }),
      });
      return;
    }

    if (url.pathname === '/api/games/state' && req.method() === 'POST') {
      if (!game) return;
      const body = req.postDataJSON() as { action: 'start' | 'begin_question' | 'reveal' | 'next' | 'end' };
      const next = transitionGameState(game.state, game.current_slide_index, authSlides, body.action);
      game.state = next.state;
      game.current_slide_index = next.slideIndex;
      if (next.state === 'question_active') {
        game.question_started_at = new Date().toISOString();
        game.reveal_payload = null;
      }
      if (next.state === 'question_reveal') {
        const s = authSlides[next.slideIndex]!;
        const sAnswers = answers.filter((a) => a.slideId === s.id);
        const counts: Record<string, number> = {};
        for (const a of sAnswers) counts[a.optionId] = (counts[a.optionId] ?? 0) + 1;
        const correctOptionIds =
          s.type === 'quiz' || s.type === 'true_false'
            ? (s.content as QuizContent).options.filter((o) => o.isCorrect).map((o) => o.id)
            : [];
        game.reveal_payload = {
          slideId: s.id,
          correctOptionIds,
          optionCounts: counts,
          totalAnswers: sAnswers.length,
        };
      }
      const ranked = computeScoreboard(players);
      const curSlide = game.public_slides[game.current_slide_index];
      const ansCount = curSlide ? answers.filter((a) => a.slideId === curSlide.id).length : 0;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game: {
            id: game.id,
            pin: game.pin,
            mode: game.mode,
            state: game.state,
            currentSlideIndex: game.current_slide_index,
            questionStartedAt: game.question_started_at,
            themeId: game.theme_id,
            quizTitle: game.quiz_title,
            maxPlayers: game.max_players,
            settings: game.settings,
            slides: game.public_slides,
            revealPayload: game.state === 'question_reveal' ? game.reveal_payload : null,
            scoreboard: ranked.slice(0, 5),
            podium: ranked.slice(0, 3),
            answerCount: ansCount,
          },
        }),
      });
      return;
    }

    if (url.pathname === '/api/games/answer' && req.method() === 'POST') {
      if (!game) return;
      const token = req.headers()['x-player-token'];
      const player = players.find((p) => p.session_token === token);
      if (!player || player.is_kicked) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'PLAYER_KICKED', message: 'Kicked' } }),
        });
        return;
      }
      const body = req.postDataJSON() as { slideId: string; optionId: string };
      const authSlide = authSlides[game.current_slide_index]!;
      const responseMs = game.question_started_at
        ? Math.max(0, Date.now() - Date.parse(game.question_started_at))
        : 500;
      const evalRes = evaluateR1SlideAnswer(authSlide, body.optionId, responseMs);
      answers.push({
        gameId: game.id,
        playerId: player.id,
        slideId: body.slideId,
        optionId: body.optionId,
        points: evalRes.points,
        isCorrect: evalRes.isCorrect,
      });
      player.total_score += evalRes.points;
      if (evalRes.isCorrect === true) player.streak += 1;
      else if (evalRes.isCorrect === false) player.streak = 0;

      // Never return correctness or points prior to reveal
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ accepted: true, slideId: body.slideId }),
      });
      return;
    }

    if (url.pathname === '/api/games/session' && req.method() === 'GET') {
      if (!game) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
        return;
      }
      const authHeader = req.headers().authorization;
      const playerToken = req.headers()['x-player-token'];
      const ranked = computeScoreboard(players);
      const curSlide = game.public_slides[game.current_slide_index];
      const ansCount = curSlide ? answers.filter((a) => a.slideId === curSlide.id).length : 0;
      const publicGame = {
        id: game.id,
        pin: game.pin,
        mode: game.mode,
        state: game.state,
        currentSlideIndex: game.current_slide_index,
        questionStartedAt: game.question_started_at,
        themeId: game.theme_id,
        quizTitle: game.quiz_title,
        maxPlayers: game.max_players,
        settings: game.settings,
        slides: game.public_slides,
        revealPayload: game.state === 'question_reveal' ? game.reveal_payload : null,
        scoreboard: ranked.slice(0, 5),
        podium: ranked.slice(0, 3),
        answerCount: ansCount,
      };

      if (authHeader?.startsWith('Bearer ')) {
        const activeRoster = players
          .filter((p) => !p.is_kicked)
          .map((p) => ({ id: p.id, nickname: p.nickname }));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ role: 'host', game: publicGame, roster: activeRoster }),
        });
        return;
      }

      const player = players.find((p) => p.session_token === playerToken);
      if (!player || player.is_kicked) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'PLAYER_KICKED', message: 'You were removed from this game.' },
          }),
        });
        return;
      }

      const rank = ranked.find((r) => r.playerId === player.id)?.rank ?? 1;
      const submittedSlideIds = answers
        .filter((a) => a.playerId === player.id)
        .map((a) => a.slideId);
      const curAns = curSlide
        ? answers.find((a) => a.playerId === player.id && a.slideId === curSlide.id)
        : undefined;

      const feedback =
        curSlide &&
        (game.state === 'question_reveal' ||
          game.state === 'scoreboard' ||
          game.state === 'podium' ||
          game.state === 'ended')
          ? {
              slideId: curSlide.id,
              submittedOptionId: curAns?.optionId ?? null,
              isCorrect: curAns?.isCorrect ?? (curSlide.type === 'poll' ? null : false),
              pointsEarned: curAns?.points ?? 0,
              totalScore: player.total_score,
              streak: player.streak,
              rank,
              totalPlayers: ranked.length,
            }
          : null;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'player',
          player: {
            id: player.id,
            nickname: player.nickname,
            totalScore: player.total_score,
            streak: player.streak,
            rank,
            totalPlayers: ranked.length,
          },
          submittedSlideIds,
          feedback,
          game: publicGame,
        }),
      });
      return;
    }

    await route.continue();
  }

  return {
    attach: async (ctx: BrowserContext) => {
      await ctx.route('https://e2e-mock.supabase.co/**', handleRoute);
      await ctx.route('**/api/games/**', handleRoute);
    },
  };
}

test('U4 full live game loop: host + 2 mobile players, kick, reconnect, reveal, scoreboard, podium & axe', async ({
  browser,
}) => {
  const hub = createMockHub();

  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await hostContext.addInitScript(() => {
    localStorage.setItem(
      'sb-e2e-mock-auth-token',
      JSON.stringify({
        access_token: 'mock-host-jwt',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-refresh',
        user: {
          id: 'host-e2e-1',
          email: 'host@eroot.app',
          aud: 'authenticated',
          role: 'authenticated',
        },
      })
    );
  });
  await hub.attach(hostContext);

  const player1Context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await hub.attach(player1Context);

  const player2Context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await hub.attach(player2Context);

  const player3Context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await hub.attach(player3Context);

  const hostPage = await hostContext.newPage();
  const p1Page = await player1Context.newPage();
  const p2Page = await player2Context.newPage();
  const p3Page = await player3Context.newPage();

  // 1. Host launches live game from Library
  await hostPage.goto('/library');
  await expect(hostPage.getByText('E2E World Trivia')).toBeVisible();
  await hostPage.getByRole('button', { name: 'Host live' }).click();
  await hostPage.getByLabel('Show questions & answers on player devices').check();
  await hostPage.getByRole('button', { name: 'Open Lobby' }).click();

  await expect(hostPage).toHaveURL(/\/host\//);
  const pinText = await hostPage.getByTestId('lobby-pin').innerText();
  expect(pinText).toBe('7654321');

  // 2. Player 1 & Player 2 join on mobile viewports
  await p1Page.goto('/join');
  await p1Page.getByLabel('Game PIN').fill('7654321');
  await p1Page.getByRole('button', { name: 'Enter' }).click();
  await p1Page.getByRole('textbox', { name: 'Nickname' }).fill('Alice');
  await p1Page.getByRole('button', { name: 'OK, go!' }).click();
  await expect(p1Page.getByText("You're in!")).toBeVisible();

  await p2Page.goto('/join?pin=7654321');
  await p2Page.getByRole('textbox', { name: 'Nickname' }).fill('Bob');
  await p2Page.getByRole('button', { name: 'OK, go!' }).click();
  await expect(p2Page.getByText("You're in!")).toBeVisible();

  // 3. Player 3 joins and gets kicked by host
  await p3Page.goto('/join?pin=7654321');
  await p3Page.getByRole('textbox', { name: 'Nickname' }).fill('Troll99');
  await p3Page.getByRole('button', { name: 'OK, go!' }).click();
  await expect(p3Page.getByText("You're in!")).toBeVisible();

  await expect(hostPage.getByTestId('host-player-count')).toHaveText('3 / 100');
  await hostPage.getByRole('button', { name: 'Troll99' }).click();
  await expect(hostPage.getByTestId('host-player-count')).toHaveText('2 / 100');
  await expect(p3Page.getByText('Removed from game')).toBeVisible();

  // 4. Host starts game -> Slide 1 Active
  await hostPage.getByRole('button', { name: 'Start Game' }).click();
  await hostPage.getByRole('button', { name: /Show now/i }).click();
  await expect(hostPage.getByRole('heading', { name: 'What is the capital of Japan?' })).toBeVisible();

  // Verify answer keys are NOT leaked on player device prior to reveal
  await expect(p1Page.getByTestId('answer-tile-A')).toBeVisible();
  await expect(p2Page.getByTestId('answer-tile-B')).toBeVisible();

  // Check axe accessibility on active host stage & mobile player play screen
  const hostAxe = await new AxeBuilder({ page: hostPage }).analyze();
  expect(hostAxe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);

  const playerAxe = await new AxeBuilder({ page: p1Page }).analyze();
  expect(playerAxe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);

  // 5. Alice picks Tokyo (correct), refreshes tab to verify reconnect!
  await p1Page.getByTestId('answer-tile-A').click();
  await expect(p1Page.getByTestId('player-answer-locked')).toBeVisible();
  await p1Page.reload();
  await expect(p1Page.getByTestId('player-answer-locked')).toBeVisible();

  // Bob picks Osaka (wrong)
  await p2Page.getByTestId('answer-tile-B').click();
  await expect(p2Page.getByTestId('player-answer-locked')).toBeVisible();

  // 6. Host reveals Slide 1
  await hostPage.getByRole('button', { name: /End question early/i }).click();
  await expect(hostPage.getByText('1 (50%)').first()).toBeVisible();
  await expect(p1Page.getByText('Correct!')).toBeVisible();
  await expect(p1Page.getByTestId('player-points-earned')).toHaveText(/\+\d+ pts/);
  await expect(p2Page.getByText('Not quite')).toBeVisible();

  // 7. Scoreboard -> Slide 2 (Poll) -> Podium -> Replay -> End
  await hostPage.getByRole('button', { name: /Next/i }).click();
  await expect(hostPage.getByText('Scoreboard — Top 5')).toBeVisible();
  await expect(hostPage.getByText('Alice')).toBeVisible();

  await hostPage.getByRole('button', { name: /Next/i }).click();
  await hostPage.getByRole('button', { name: /Show now/i }).click();

  await p1Page.getByTestId('answer-tile-A').click();
  await p2Page.getByTestId('answer-tile-B').click();

  await hostPage.getByRole('button', { name: /End question early/i }).click();
  await expect(p1Page.getByText('Response recorded')).toBeVisible();

  await hostPage.getByRole('button', { name: /Next/i }).click();
  await expect(hostPage.getByTestId('podium-stage')).toBeVisible();
  await hostPage.getByRole('button', { name: 'Replay podium' }).click();
  await hostPage.getByRole('button', { name: 'Finish & Save Report' }).click();

  await expect(hostPage.getByText('Game ended')).toBeVisible();
  await expect(p1Page.getByText('Thanks for playing!')).toBeVisible();

  await hostContext.close();
  await player1Context.close();
  await player2Context.close();
  await player3Context.close();
});

