import { useEffect, useState } from 'react';
import { DASHBOARD_PROMPT_SUGGESTIONS } from './data';

const ROTATION_INTERVAL_MS = 3500;

export function useRotatingSuggestion() {
  const [index, setIndex] = useState(0);
  const count = DASHBOARD_PROMPT_SUGGESTIONS.length as number;

  useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, []);

  if (count < 1) return '';
  return DASHBOARD_PROMPT_SUGGESTIONS[index % count];
}
