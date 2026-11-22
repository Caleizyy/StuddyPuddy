import { describe, expect, it } from 'vitest';
import { centerSquare, checkImageFile, ImageError } from './image';
import { initialsOf } from '@/components/profile/Avatar';

const file = (type: string, size = 100) => new File([new Uint8Array(size)], 'x', { type });

describe('centerSquare', () => {
  it('crops a wide picture to its middle', () => {
    expect(centerSquare(400, 200)).toEqual({ x: 100, y: 0, side: 200 });
  });
  it('crops a tall picture to its middle', () => {
    expect(centerSquare(200, 500)).toEqual({ x: 0, y: 150, side: 200 });
  });
  it('keeps a square picture whole', () => {
    expect(centerSquare(300, 300)).toEqual({ x: 0, y: 0, side: 300 });
  });
});

describe('checkImageFile', () => {
  it('accepts jpeg, png and webp', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(() => checkImageFile(file(type))).not.toThrow();
    }
  });
  it('refuses other types and huge files', () => {
    expect(() => checkImageFile(file('image/gif'))).toThrow(ImageError);
    expect(() => checkImageFile(file('application/pdf'))).toThrow(ImageError);
    expect(() => checkImageFile(file('image/png', 11 * 1024 * 1024))).toThrow(ImageError);
  });
});

describe('initialsOf', () => {
  it('uses the first letters of up to two words', () => {
    expect(initialsOf('ada lovelace')).toBe('AL');
    expect(initialsOf('  Ben  ')).toBe('B');
    expect(initialsOf('Jean Luc Picard')).toBe('JL');
  });
  it('falls back to a question mark', () => {
    expect(initialsOf('   ')).toBe('?');
  });
});
