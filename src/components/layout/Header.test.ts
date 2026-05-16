import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/tanstack-react-start', () => ({
  Show: () => null,
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) =>
    createElement('a', { href: to, ...props }, children),
}));

import Header from './Header';

describe('Header', () => {
  it('contains an accessible home link around the logo', () => {
    const markup = renderToStaticMarkup(
      createElement(Header, { showMeta: false }),
    );

    expect(markup).toContain('href="/"');
    expect(markup).toContain('aria-label="EV Agent home"');
  });
});
