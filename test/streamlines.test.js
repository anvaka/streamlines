import { describe, it, expect } from 'vitest';
import computeStreamlines from '../index.js';

// Provide performance polyfill if not present (Vitest/JSDOM has it, but keep safe)
if (!globalThis.performance) {
  globalThis.performance = { now: () => Date.now() };
}

describe('streamlines basic', () => {
  it('computes at least one streamline', async () => {
    const vectorField = p => ({ x: -p.y, y: p.x });
    const seedPoint = { x: -2, y: 0 };
    const boundingBox = { left: -5, top: -5, width: 10, height: 10 };
    let addedLines = 0;

    await computeStreamlines({
      vectorField,
      seed: seedPoint,
      boundingBox,
      onStreamlineAdded(streamline) {
        expect(streamline.length).toBeGreaterThan(1);
        addedLines += 1;
      }
    }).run();

    expect(addedLines).toBeGreaterThan(0);
  });
});
