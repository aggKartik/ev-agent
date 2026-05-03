import type { PlanRequest } from '#/shared/plan/contracts';

type ConnectorSlug = PlanRequest['connectorTypes'][number];

type TomTomPlugType = string;

/** kWh consumed per 100 km from average traction Wh/mile (steady-state approximation). */
export function consumptionWhPerMileToInkWhPerHundredKm(
  whPerMile: number,
): number {
  return (whPerMile * 100) / (1.609_344 * 1000);
}

/** Map planner connector slug → TomTom `plugTypes` literals (subset of official docs). */
export function connectorSlugsToTomTomDcPlugTypes(
  slugs: ConnectorSlug[],
): TomTomPlugType[] {
  const set = new Set<TomTomPlugType>();

  const addMaybe = (
    slug: ConnectorSlug,
    plugs: readonly TomTomPlugType[],
  ): void => {
    if (!slugs.includes(slug)) return;
    for (const p of plugs) set.add(p);
  };

  addMaybe('NACS', [
    'Tesla_Connector',
    'IEC_62196_Type_2_Connector_Cable_Attached',
  ]);
  addMaybe('CCS1', [
    'Combo_to_IEC_62196_Type_1_Base',
    'IEC_62196_Type_1_Connector_Cable_Attached',
  ]);
  addMaybe('J1772', ['SAE_J1772']);
  addMaybe('TYPE_2', [
    'IEC_62196_Type_2_Outlet',
    'IEC_62196_Type_2_Connector_Cable_Attached',
    'Combo_to_IEC_62196_Type_2_Base',
  ]);
  addMaybe('CHADEMO', ['CHAdeMO']);

  /* Default if unknown mapping edge case */
  if (set.size === 0) {
    set.add('Combo_to_IEC_62196_Type_1_Base').add('Tesla_Connector');
  }

  return [...set];
}

/**
 * Charging connector model for POST `chargingParameters` (DC-focused; adds Type-1/J1772 AC when selected).
 */
export function buildTomTomChargingConnectorBlocks(
  slugs: ConnectorSlug[],
): object[] {
  const dcPlugTypes = connectorSlugsToTomTomDcPlugTypes(slugs);
  const connectors: object[] = [];

  const wantsAc = slugs.includes('J1772') || slugs.includes('TYPE_2');

  if (wantsAc) {
    const acPlugs: TomTomPlugType[] = [];
    if (slugs.includes('TYPE_2')) {
      acPlugs.push(
        'IEC_62196_Type_2_Outlet',
        'IEC_62196_Type_2_Connector_Cable_Attached',
        'Combo_to_IEC_62196_Type_2_Base',
      );
    }
    if (slugs.includes('J1772') || slugs.includes('CCS1')) {
      acPlugs.push('SAE_J1772');
    }
    if (acPlugs.length === 0) {
      acPlugs.push(
        'IEC_62196_Type_2_Outlet',
        'IEC_62196_Type_2_Connector_Cable_Attached',
      );
    }

    connectors.push({
      currentType: 'AC3',
      plugTypes: [...new Set(acPlugs)],
      efficiency: 0.92,
      maxPowerInkW: 11,
    });
  }

  connectors.push({
    currentType: 'DC',
    plugTypes: [...new Set(dcPlugTypes)],
    voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
    efficiency: 0.92,
    maxPowerInkW: 250,
  });
  connectors.push({
    currentType: 'DC',
    plugTypes: [...new Set(dcPlugTypes)],
    voltageRange: { minVoltageInV: 500, maxVoltageInV: 2000 },
    efficiency: 0.92,
    baseLoadInkW: 0.3,
    maxPowerInkW: 0,
  });

  return connectors;
}
