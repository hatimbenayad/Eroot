import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/en';
import { resolveTranslation } from '@/i18n/translation';

describe('i18n dictionary resolution', () => {
  it('resolves nested translation keys and template variables', () => {
    const dict = en as unknown as Record<string, unknown>;
    expect(resolveTranslation(dict, 'common.appName')).toBe('Eroot');
    expect(
      resolveTranslation(dict, 'tiles.optionLabel', {
        letter: 'A',
        shape: 'triangle',
        text: 'Mercury',
      })
    ).toBe('Option A (triangle): Mercury');
  });

  it('falls back to key path when missing', () => {
    const dict = en as unknown as Record<string, unknown>;
    expect(resolveTranslation(dict, 'missing.nested.key')).toBe('missing.nested.key');
  });
});
