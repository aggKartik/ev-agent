import {
  Beer,
  Camera,
  Check,
  Coffee,
  Fish,
  Mountain,
  Plus,
  Soup,
  Store,
  Waves,
} from 'lucide-react';
import { Box, Grid } from 'styled-system/jsx';
import Button from '#/components/Button';
import Icon from '#/components/Icon';
import type { PlanActivitySelection } from '#/features/plan/contracts';
import type {
  PlanActivityCatalogItem,
  PlanActivityId,
} from '#/features/plan/data';
import { css } from '../../../styled-system/css';
import ActivityDwellSlider from './ActivityDwellSlider';

type ActivitySelectorProps = {
  catalog: PlanActivityCatalogItem[];
  value: PlanActivitySelection[];
  onChange: (value: PlanActivitySelection[]) => void;
};

const activityIcons = {
  coffee: Coffee,
  hike: Mountain,
  scenic: Camera,
  diner: Soup,
  thrift: Store,
  brewery: Beer,
  photo: Camera,
  beach: Waves,
  tacos: Fish,
} satisfies Record<PlanActivityId, typeof Coffee>;

const gridClass = css({
  display: 'grid',
  gridTemplateColumns: {
    base: '1fr',
    sm: 'repeat(auto-fit, minmax(240px, 1fr))',
  },
  gap: '2',
});

const cardClass = css({
  width: 'full',
  borderWidth: '1px',
  borderColor: 'alpha.cream.12',
  borderRadius: '14px',
  background: 'rgba(245, 234, 208, 0.03)',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  _hover: {
    borderColor: 'alpha.peach.45',
    background: 'alpha.cream.08',
  },
  '&[data-selected=true]': {
    borderColor: 'peach.400',
    background:
      'linear-gradient(180deg, rgba(255, 149, 102, 0.1), rgba(233, 74, 140, 0.05))',
  },
});

const headClass = css({
  width: 'full',
  display: 'flex',
  alignItems: 'center',
  gap: '2.5',
  p: '3',
  textAlign: 'left',
  '& > span': {
    width: 'full',
    display: 'block',
  },
  '& > span > span:not([data-part])': {
    width: 'full',
    display: 'flex',
    alignItems: 'center',
    gap: '2.5',
  },
  '& [data-part=leading-icon], & [data-part=trailing-icon]': {
    display: 'none',
  },
});

const iconWrapClass = css({
  width: '22px',
  height: '22px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const labelClass = css({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
});

const titleClass = css({
  fontSize: '14px',
  fontWeight: '600',
  color: 'cream.100',
});

const descClass = css({
  display: 'none',
});

const toggleClass = css({
  width: '24px',
  height: '24px',
  borderRadius: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'alpha.cream.08',
  color: 'cream.600',
  flexShrink: 0,
  '[data-selected=true] &': {
    background: 'peach.400',
    color: 'night.800',
  },
});

export default function ActivitySelector({
  catalog,
  value,
  onChange,
}: ActivitySelectorProps) {
  const byId = new Map(value.map((selection) => [selection.id, selection]));

  const toggle = (id: PlanActivityId) => {
    const existing = byId.get(id);
    if (existing) {
      onChange(value.filter((selection) => selection.id !== id));
      return;
    }
    onChange([...value, { id, dwellMinutes: 45 }]);
  };

  const setDwell = (id: PlanActivityId, dwellMinutes: number) => {
    onChange(
      value.map((selection) =>
        selection.id === id ? { ...selection, dwellMinutes } : selection,
      ),
    );
  };

  return (
    <Grid className={gridClass}>
      {catalog.map((activity) => {
        const selected = byId.get(activity.id);
        const ActivityIcon = activityIcons[activity.id];
        return (
          <Box
            key={activity.id}
            className={cardClass}
            data-selected={Boolean(selected)}
          >
            <Button
              type="button"
              unstyled
              className={headClass}
              onClick={() => toggle(activity.id)}
            >
              <Box className={iconWrapClass} style={{ color: activity.color }}>
                <Icon icon={ActivityIcon} size="sm" />
              </Box>
              <Box className={labelClass}>
                <Box className={titleClass}>{activity.label}</Box>
                <Box className={descClass}>{activity.description}</Box>
              </Box>
              <Box className={toggleClass}>
                <Icon icon={selected ? Check : Plus} size="xs" />
              </Box>
            </Button>
            {selected ? (
              <ActivityDwellSlider
                color={activity.color}
                value={selected.dwellMinutes}
                onChange={(nextValue) => setDwell(activity.id, nextValue)}
              />
            ) : null}
          </Box>
        );
      })}
    </Grid>
  );
}
