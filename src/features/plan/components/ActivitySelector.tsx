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
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import type { PlanActivityId } from '#/shared/plan/constants';
import type { PlanActivitySelection } from '#/shared/plan/contracts';
import type { PlanActivityCatalogItem } from '#/shared/plan/data';
import { selectableCard } from '#/styled-system/recipes/selectable-card';
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

const cardGrid = selectableCard({ density: 'compact' });

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
    <Grid className={cardGrid.grid}>
      {catalog.map((activity) => {
        const selected = byId.get(activity.id);
        const ActivityIcon = activityIcons[activity.id];
        const cardClasses = selectableCard({
          density: 'compact',
          selected: Boolean(selected),
        });
        return (
          <Box key={activity.id} className={cardClasses.card}>
            <Button
              type="button"
              unstyled
              contentMode="custom"
              className={cardClasses.head}
              aria-pressed={Boolean(selected)}
              onClick={() => toggle(activity.id)}
            >
              <Box
                className={cardClasses.icon}
                style={{ color: activity.color }}
              >
                <Icon icon={ActivityIcon} size="sm" />
              </Box>
              <Box className={cardClasses.label}>
                <Box className={cardClasses.title}>{activity.label}</Box>
                <Box className={cardClasses.desc}>{activity.description}</Box>
              </Box>
              <Box className={cardClasses.toggle} aria-hidden="true">
                <Icon icon={selected ? Check : Plus} size="xs" />
              </Box>
            </Button>
            {selected ? (
              <ActivityDwellSlider
                label={activity.label}
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
