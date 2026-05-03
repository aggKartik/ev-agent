import { Box } from 'styled-system/jsx';
import type { DashboardUtilityTile } from '#/features/dashboard/contracts';
import { toneStyle } from '#/features/dashboard/tone';
import { dashboard } from '#/styled-system/recipes/dashboard';

type UtilityTilesProps = {
  tiles: DashboardUtilityTile[];
  onPlan: () => void;
  onConnectTesla: () => void;
};

export default function UtilityTiles({
  tiles,
  onPlan,
  onConnectTesla,
}: UtilityTilesProps) {
  const slots = dashboard();

  return (
    <Box
      as="section"
      gridArea="utils"
      display="grid"
      gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr' }}
      gap="3"
      alignContent="start"
      aria-label="Dashboard utilities"
    >
      {tiles.map((tile) => {
        const onClick =
          tile.action === 'plan'
            ? onPlan
            : tile.action === 'tesla-connect'
              ? onConnectTesla
              : undefined;
        return (
          <button
            type="button"
            key={tile.id}
            className={slots.utilTile}
            style={toneStyle(tile.tone)}
            onClick={onClick}
            disabled={!onClick}
          >
            <Box as="span" className={slots.utilKicker}>
              {tile.kicker}
            </Box>
            <Box as="span" className={slots.utilTitle}>
              {tile.title}
            </Box>
            <Box as="span" className={slots.utilSub}>
              {tile.sub}
            </Box>
            <Box as="span" className={slots.utilArrow} aria-hidden="true">
              →
            </Box>
          </button>
        );
      })}
    </Box>
  );
}
