import polyline from '@mapbox/polyline';
import { describe, expect, it } from 'vitest';
import {
  buildTomTomChargingConnectorBlocks,
  connectorSlugsToTomTomDcPlugTypes,
  consumptionWhPerMileToInkWhPerHundredKm,
} from './chargingParams';
import {
  corridorCoordsFromTomTomLegs,
  extractChargeAnchorsFromTomTomLegs,
  type TomTomLeg,
} from './legs';

describe('consumptionWhPerMileToInkWhPerHundredKm', () => {
  it('converts traction Wh/mi to LDEV pairs scale', () => {
    expect(consumptionWhPerMileToInkWhPerHundredKm(250)).toBeCloseTo(15.53, 1);
    expect(consumptionWhPerMileToInkWhPerHundredKm(280)).toBeCloseTo(17.4, 1);
  });
});

describe('connectorSlugsToTomTomDcPlugTypes', () => {
  it('maps NACS+CCS1 to CCS1 + Tesla plug variants', () => {
    const plugs = connectorSlugsToTomTomDcPlugTypes(['NACS', 'CCS1']);
    expect(plugs).toContain('Tesla_Connector');
    expect(plugs).toContain('Combo_to_IEC_62196_Type_1_Base');
  });
});

describe('corridorCoordsFromTomTomLegs', () => {
  it('reads encodedPolyline on leg root (TomTom nests it outside summary)', () => {
    const enc = polyline.encode(
      [
        [37.7749, -122.4194],
        [37.8044, -122.2712],
      ],
      5,
    );
    const corridor = corridorCoordsFromTomTomLegs([
      { summary: {}, encodedPolyline: enc },
    ]);
    expect(corridor.length).toBeGreaterThanOrEqual(2);
    expect(corridor[0]?.lat).toBeCloseTo(37.7749, 4);
    expect(corridor.at(-1)?.lat).toBeCloseTo(37.8044, 4);
  });

  it('defaults missing encodedPolylinePrecision to 5', () => {
    const enc = polyline.encode([[1.2, -3.4]], 5);
    const [p] = corridorCoordsFromTomTomLegs([
      { encodedPolyline: enc, summary: {} },
    ]);
    expect(p?.lat).toBeCloseTo(1.2, 4);
    expect(p?.lng).toBeCloseTo(-3.4, 4);
  });

  it('defaults invalid encodedPolylinePrecision values to 5', () => {
    const enc = polyline.encode([[1.2, -3.4]], 5);

    for (const encodedPolylinePrecision of [Number.NaN, 4.5]) {
      const [p] = corridorCoordsFromTomTomLegs([
        { encodedPolyline: enc, encodedPolylinePrecision, summary: {} },
      ]);

      expect(p?.lat).toBeCloseTo(1.2, 4);
      expect(p?.lng).toBeCloseTo(-3.4, 4);
    }
  });
});

describe('extractChargeAnchorsFromTomTomLegs', () => {
  const sampleLeg = {
    summary: {
      chargingInformationAtEndOfLeg: {
        chargingParkUuid: 'a4b60dff-b599-339a-0a1b-aae200153b86',
        chargingTimeInSeconds: 1800,
        chargingParkName: 'Park A',
        chargingParkLocation: {
          coordinate: { latitude: 40.758, longitude: -73.9855 },
        },
      },
    },
  } satisfies TomTomLeg;

  it('emits anchored candidates when location + summary exist', () => {
    const out = extractChargeAnchorsFromTomTomLegs([sampleLeg]);
    expect(out).toHaveLength(1);
    expect(out[0].ordinal).toBe(1);
    expect(out[0].coordinate).toEqual({
      lat: 40.758,
      lng: -73.9855,
    });
    expect(out[0].vendor?.tomTomChargingParkUuid).toBe(
      'a4b60dff-b599-339a-0a1b-aae200153b86',
    );
    expect(out[0].suggestedDwellMinutes).toBe(30);
  });

  it('skips legs without coordinates', () => {
    expect(
      extractChargeAnchorsFromTomTomLegs([
        {
          summary: {
            chargingInformationAtEndOfLeg: {
              chargingParkUuid: 'x',
              chargingTimeInSeconds: 60,
            },
          },
        },
      ]),
    ).toHaveLength(0);
  });
});

describe('buildTomTomChargingConnectorBlocks', () => {
  it('returns DC tiers plus connectors for NACS+CCS', () => {
    const blocks = buildTomTomChargingConnectorBlocks(['NACS', 'CCS1']);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });

  it('adds AC3 when TYPE_2 is supported', () => {
    const blocks = buildTomTomChargingConnectorBlocks(['TYPE_2', 'CCS1']);
    const hasAc = blocks.some(
      (b) => (b as { currentType?: string }).currentType === 'AC3',
    );
    expect(hasAc).toBe(true);
  });
});
