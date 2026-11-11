import { describe, expect, it } from 'vitest';
import { generateFriendlyNickname, isNicknameClean } from '@shared/moderation/nickname';

describe('Nickname moderation & friendly generator (U4)', () => {
  it('blocks profanity including basic leetspeak substitutions', () => {
    expect(isNicknameClean('Badger42')).toBe(true);
    expect(isNicknameClean('sh1tface')).toBe(false);
    expect(isNicknameClean('   ')).toBe(false);
    expect(isNicknameClean('A'.repeat(25))).toBe(false);
  });

  it('generates clean friendly nicknames', () => {
    const name = generateFriendlyNickname(5);
    expect(name.length).toBeGreaterThanOrEqual(6);
    expect(isNicknameClean(name)).toBe(true);
  });
});

