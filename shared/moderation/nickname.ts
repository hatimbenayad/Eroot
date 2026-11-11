const BLOCKED_TERMS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'cunt',
  'dick',
  'pussy',
  'whore',
  'slut',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'nazi',
  'puta',
  'puto',
  'cabron',
  'mierda',
  'gilipollas',
  'pendejo',
  'maricon',
  'cojones',
] as const;

const ADJECTIVES = [
  'Brave',
  'Bright',
  'Calm',
  'Clever',
  'Cosmic',
  'Daring',
  'Eager',
  'Gentle',
  'Happy',
  'Jolly',
  'Kind',
  'Lucky',
  'Mighty',
  'Nimble',
  'Quick',
  'Sharp',
  'Solar',
  'Swift',
  'Vivid',
  'Wise',
] as const;

const NOUNS = [
  'Badger',
  'Comet',
  'Dolphin',
  'Eagle',
  'Falcon',
  'Fox',
  'Gecko',
  'Heron',
  'Koala',
  'Lynx',
  'Otter',
  'Owl',
  'Panda',
  'Puffin',
  'Rabbit',
  'Raven',
  'Robin',
  'Tiger',
  'Turtle',
  'Wolf',
] as const;

function normalizeForFilter(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/[^a-z]/g, '');
}

export function isNicknameClean(nickname: string): boolean {
  const trimmed = nickname.trim();
  if (trimmed.length === 0 || trimmed.length > 24) {
    return false;
  }
  const normalized = normalizeForFilter(trimmed);
  if (normalized.length === 0) {
    return false;
  }
  const collapsed = normalized.replace(/(.)\1+/g, '$1');
  return !BLOCKED_TERMS.some(
    (term) => normalized.includes(term) || collapsed.includes(term)
  );
}

export function generateFriendlyNickname(seedIndex?: number): string {
  const adjIdx =
    typeof seedIndex === 'number'
      ? Math.abs(seedIndex) % ADJECTIVES.length
      : Math.floor(Math.random() * ADJECTIVES.length);
  const nounIdx =
    typeof seedIndex === 'number'
      ? Math.abs(seedIndex * 7 + 3) % NOUNS.length
      : Math.floor(Math.random() * NOUNS.length);
  const suffix = Math.floor(10 + Math.random() * 90);
  return `${ADJECTIVES[adjIdx]}${NOUNS[nounIdx]}${suffix}`;
}
