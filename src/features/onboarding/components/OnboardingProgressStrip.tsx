import { Box } from 'styled-system/jsx';
import { onboarding, progress } from '#/styled-system/recipes';

type Props = {
  label: string;
  percent: number;
};

export default function OnboardingProgressStrip({ label, percent }: Props) {
  const o = onboarding();
  const p = progress();
  return (
    <Box className={o.progressRow}>
      <Box>{label}</Box>
      <Box className={o.progressTrackRegion}>
        <Box className={p.track} aria-hidden="true">
          <Box className={p.fill} style={{ width: `${percent}%` }} />
        </Box>
      </Box>
      <Box>{Math.round(percent)}%</Box>
    </Box>
  );
}
