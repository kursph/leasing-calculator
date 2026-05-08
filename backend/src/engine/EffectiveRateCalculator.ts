import Decimal from 'decimal.js';

// VKrG Appendix 1 — APR (Effektivzinssatz) via Newton-Raphson
// Solve: GIK = Σ [Payment_t / (1 + r_eff)^t] + residual / (1 + r_eff)^n
export function calculateEffectiveRate(
  gik: number,
  monthlyPayment: number,
  termMonths: number,
  residualValue: number,
  advancePayment: number = 0
): number {
  let r = 0.005; // initial guess: 0.5% monthly

  for (let iter = 0; iter < 100; iter++) {
    let pv = 0;
    let dpv = 0;

    for (let t = 1; t <= termMonths; t++) {
      const disc = Math.pow(1 + r, t);
      pv += monthlyPayment / disc;
      dpv -= (t * monthlyPayment) / (disc * (1 + r));
    }

    const discN = Math.pow(1 + r, termMonths);
    pv += residualValue / discN;
    dpv -= (termMonths * residualValue) / (discN * (1 + r));

    const f = gik - advancePayment - pv;
    const df = -dpv;
    const newR = r - f / df;

    if (Math.abs(newR - r) < 1e-8) break;
    r = newR;
  }

  // Annualized (nominal annual effective rate)
  return new Decimal(r).mul(12).toDecimalPlaces(6).toNumber();
}
