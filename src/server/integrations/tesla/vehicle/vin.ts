/**
 * Tesla VIN decoding. Used to prefill the onboarding make/model/year form
 * fields from a linked Tesla account's first vehicle without requiring an
 * extra Fleet API call for `vehicle_config`.
 *
 * - Year: 10th VIN character maps to model year per the NHTSA year code table.
 * - Model: first four VIN chars identify the platform; only the codes Tesla
 *   has shipped are mapped (unknown codes fall through to `null`).
 */

const YEAR_BY_CODE: Record<string, string> = {
  G: '2016',
  H: '2017',
  J: '2018',
  K: '2019',
  L: '2020',
  M: '2021',
  N: '2022',
  P: '2023',
  R: '2024',
  S: '2025',
  T: '2026',
};

export type TeslaVinDecoded = {
  model: string | null;
  year: string | null;
};

export function decodeTeslaVin(
  vin: string | null | undefined,
): TeslaVinDecoded {
  if (typeof vin !== 'string' || vin.length !== 17) {
    return { model: null, year: null };
  }
  const upper = vin.toUpperCase();
  const year = YEAR_BY_CODE[upper.charAt(9)] ?? null;
  const model = resolveModel(upper);
  return { model, year };
}

function resolveModel(vin: string): string | null {
  const prefix4 = vin.slice(0, 4);
  switch (prefix4) {
    case '5YJS':
    case '7SAS':
      return 'Model S';
    case '5YJX':
    case '7SAX':
      return 'Model X';
    case '5YJ3':
    case '7SA3':
    case 'LRW3':
    case 'XP73':
      return 'Model 3';
    case '5YJY':
    case '7SAY':
    case 'LRWY':
    case 'XP7Y':
      return 'Model Y';
  }
  if (vin.startsWith('7G2') || vin.startsWith('7SAC')) {
    return 'Cybertruck';
  }
  return null;
}
