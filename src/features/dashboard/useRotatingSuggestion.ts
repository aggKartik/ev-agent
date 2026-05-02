import { useEffect, useState } from 'react';
import { DASHBOARD_PROMPT_SUGGESTIONS } from './data';

const ROTATION_INTERVAL_MS = 3500;

export function useRotatingSuggestion() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex(
        (current) => (current + 1) % DASHBOARD_PROMPT_SUGGESTIONS.length,
      );
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, []);

  return DASHBOARD_PROMPT_SUGGESTIONS[
    index % DASHBOARD_PROMPT_SUGGESTIONS.length
  ];
}
