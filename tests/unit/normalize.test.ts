import { describe, expect, it } from 'vitest';
import { govde, maddeKarsilastir, maddeRefleri, norm, refeUyar } from '../../src/core';

describe('Türkçe normalleştirme', () => {
  it('büyük İ/I, diakritikler ve noktalama', () => {
    expect(norm('FINDIK')).toBe('findik');
    expect(norm('İnorganik Arsenik (As III + As V)')).toBe('inorganik arsenik as iii as v');
    expect(norm('Şeker, Ğ, Ü, Ö, Ç')).toBe('seker g u o c');
  });
  it('ek atma ve ünsüz yumuşaması', () => {
    expect(govde('cekirdegi')).toBe('cekirdek');
    expect(govde('findikta')).toBe('findik');
    expect(govde('pirincte')).toBe('pirinc');
    expect(govde('ette')).toBe('et');
  });
});

describe('Madde atıfları', () => {
  it('sayısal sıralama', () => {
    expect(maddeKarsilastir('1.1.2', '1.1.10')).toBeLessThan(0);
    expect(maddeKarsilastir('3.1', '3.1.1')).toBeLessThan(0);
  });
  it('aralık ve tek atıf', () => {
    expect(maddeRefleri('1.1.10 ile 1.1.11 maddeleri ve 3.2.1 hariç')).toEqual([{ bas: '1.1.10', son: '1.1.11' }, { bas: '3.2.1', son: '3.2.1' }]);
  });
  it('alt maddeler aralığa dahil', () => {
    expect(refeUyar('3.2.12.3', { bas: '3.2.12', son: '3.2.12' })).toBe(true);
    expect(refeUyar('1.1.11', { bas: '1.1.10', son: '1.1.11' })).toBe(true);
    expect(refeUyar('1.1.12', { bas: '1.1.10', son: '1.1.11' })).toBe(false);
  });
});
