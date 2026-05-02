import { type KeyboardEvent, useState } from 'react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/Button';
import { Text } from '#/components/Text';
import { formatDashboardDate } from '#/features/dashboard/helpers';
import { useRotatingSuggestion } from '#/features/dashboard/useRotatingSuggestion';
import { cx } from '../../../styled-system/css';
import { chip } from '../../../styled-system/recipes/chip';
import { dashboard } from '../../../styled-system/recipes/dashboard';
import { panel } from '../../../styled-system/recipes/panel';

type HeroProps = {
  driverFirstName: string;
  generatedAt: string;
  onPlan: () => void;
};

const PROMPT_TOOLS = ['Stop', 'Date', 'Vibe'] as const;

export default function Hero({
  driverFirstName,
  generatedAt,
  onPlan,
}: HeroProps) {
  const slots = dashboard();
  const [prompt, setPrompt] = useState('');
  const suggestion = useRotatingSuggestion();

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onPlan();
    }
  };

  return (
    <>
      <Box className={chip({ tone: 'live' })} alignSelf="flex-start">
        <Box as="span">EVAGENT · ONLINE</Box>
        <Box as="span" color="cream.700">
          ·
        </Box>
        <time dateTime={generatedAt}>{formatDashboardDate(generatedAt)}</time>
      </Box>

      <Text as="h1" className={slots.heroTitle}>
        Where are we
        <Box as="span" className={slots.heroTitleAccent}>
          {' '}
          headed
        </Box>
        ,<br />
        <Box as="span" className={slots.heroTitleName}>
          {driverFirstName.toUpperCase()}
        </Box>
        ?
      </Text>

      <Box className={cx(panel({ variant: 'glass' }), slots.prompt)}>
        <label className={slots.promptPrefix} htmlFor="dashboard-prompt">
          Tell the agent
        </label>
        <textarea
          id="dashboard-prompt"
          className={slots.promptInput}
          rows={2}
          value={prompt}
          placeholder={suggestion}
          onChange={(event) => setPrompt(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <Box className={slots.promptActions}>
          <Box className={slots.promptTools} aria-label="Planning modifiers">
            {PROMPT_TOOLS.map((tool) => (
              <Box
                as="span"
                key={tool}
                className={chip({ size: 'micro', tone: 'neutral' })}
              >
                + {tool}
              </Box>
            ))}
          </Box>
          <Button variant="primary" onClick={onPlan}>
            Plan a trip
          </Button>
        </Box>
      </Box>
    </>
  );
}
