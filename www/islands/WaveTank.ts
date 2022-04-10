export interface Spring {
  p: number;
  v: number;
}

export class WaveTank {
  springs = [] as Spring[];
  waveLength = 100;
  k = 0.02;
  damping = 0.02;
  spread = 0.02;

  constructor() {
    for (let i = 0; i < this.waveLength; i++) {
      this.springs[i] = {
        p: 0,
        v: 0,
      };
    }
  }

  update(springs: Spring[]) {
    for (const i of springs) {
      const a = -this.k * i.p - this.damping * i.v;
      i.p += i.v;
      i.v += a;
    }

    const leftDeltas = [];
    const rightDeltas = [];

    for (let t = 0; t < 8; t++) {
      for (let i = 0; i < springs.length; i++) {
        const prev = springs[(i - 1 + springs.length) % springs.length];
        const next = springs[(i + 1) % springs.length];

        leftDeltas[i] = this.spread * (springs[i].p - prev.p);
        rightDeltas[i] = this.spread * (springs[i].p - next.p);
      }

      for (let i = 0; i < springs.length; i++) {
        const prev = springs[(i - 1 + springs.length) % springs.length];
        const next = springs[(i + 1) % springs.length];
        prev.v += leftDeltas[i];
        next.v += rightDeltas[i];
        prev.p += leftDeltas[i];
        next.p += rightDeltas[i];
      }
    }
  }
}
