import { describe, expect, it } from 'vitest';

import parseCoord from './parseCoord.js';

const reference = (coord: string) => coord.split('|').map((n) => parseInt(n, 10));

describe('parseCoord', () => {
  it('parses row and col', () => {
    expect(parseCoord('0|0')).toEqual([0, 0]);
    expect(parseCoord('12|7')).toEqual([12, 7]);
    expect(parseCoord('-1|8')).toEqual([-1, 8]);
  });

  it('matches split + parseInt on every input', () => {
    const inputs = [
      '', '|', '1', '1|', '|1', '-|1', '1|-', '--1|2', '1|2|3', '1||2',
      ' 1|2', '1 |2', '1| 2', '+1|2', '1.5|2', '1e3|2', '0x10|2', 'a|b', '1a|2',
      '01|002', '-0|0', '0|-0', '٣|1', '1|2\n',
      '123456789012345|1', '1234567890123456|1', '99999999999999999999|1',
      '-123456789012345|-123456789012345',
    ];

    for (let r = -12; r <= 30; r += 1) {
      for (let c = -12; c <= 30; c += 1) inputs.push(`${r}|${c}`);
    }

    for (const coord of inputs) {
      expect(parseCoord(coord), JSON.stringify(coord)).toEqual(reference(coord));
    }
  });

  it('keeps the sign of -0 like parseInt', () => {
    expect(Object.is(parseCoord('-0|0')[0], -0)).toBe(true);
  });
});
