import { describe, expect, it } from 'vitest';
import { generateFriendlyNickname, isNicknameClean } from '@shared/moderation/nickname';

describe('Nickname moderation & friendly generator (U4/U10)', () => {
  it('blocks profanity including obfuscated leetspeak, repeats, and Spanish terms', () => {
    expect(isNicknameClean('Badger42')).toBe(true);
    expect(isNicknameClean('EstrellaAzul')).toBe(true);
    expect(isNicknameClean('sh1tface')).toBe(false);
    expect(isNicknameClean('f_u_c_k!')).toBe(false);
    expect(isNicknameClean('shhh11t')).toBe(false);
    expect(isNicknameClean('m1erd@')).toBe(false);
    expect(isNicknameClean('   ')).toBe(false);
    expect(isNicknameClean('A'.repeat(25))).toBe(false);
  });

  it('generates clean friendly nicknames', () => {
    const name = generateFriendlyNickname(5);
    expect(name.length).toBeGreaterThanOrEqual(6);
    expect(isNicknameClean(name)).toBe(true);
  });
});
