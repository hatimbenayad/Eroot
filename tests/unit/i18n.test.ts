import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';
import { resolveTranslation } from '@/i18n/translation';

function collectLeafPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  const paths: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object') {
      paths.push(...collectLeafPaths(val as Record<string, unknown>, path));
    } else {
      paths.push(path);
    }
  }
  return paths.sort();
}

describe('i18n dictionary resolution and ES parity (U10)', () => {
  it('resolves nested translation keys and template variables in EN and ES', () => {
    const enDict = en as unknown as Record<string, unknown>;
    const esDict = es as unknown as Record<string, unknown>;
    expect(resolveTranslation(enDict, 'common.appName')).toBe('Eroot');
    expect(
      resolveTranslation(enDict, 'tiles.optionLabel', {
        letter: 'A',
        shape: 'triangle',
        text: 'Mercury',
      })
    ).toBe('Option A (triangle): Mercury');
    expect(
      resolveTranslation(esDict, 'tiles.optionLabel', {
        letter: 'A',
        shape: 'triángulo',
        text: 'Mercurio',
      })
    ).toBe('Opción A (triángulo): Mercurio');
  });

  it('maintains 100% leaf-key parity between en and es dictionaries', () => {
    const enKeys = collectLeafPaths(en as unknown as Record<string, unknown>);
    const esKeys = collectLeafPaths(es as unknown as Record<string, unknown>);
    expect(esKeys).toEqual(enKeys);
  });

  it('falls back to key path when missing', () => {
    const dict = en as unknown as Record<string, unknown>;
    expect(resolveTranslation(dict, 'missing.nested.key')).toBe('missing.nested.key');
  });
});
