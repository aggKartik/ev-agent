import { ClerkProvider } from '@clerk/tanstack-react-start';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { useState } from 'react';
import { trpc, trpcClient } from '#/lib/trpc';
import { css } from '#/styled-system/css';
import '../styles/global.css';

import appCss from '../styles.css?url';

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;root.classList.remove('light');root.classList.add('dark');root.setAttribute('data-theme','dark');root.style.colorScheme='dark';window.localStorage.setItem('theme','dark');}catch(e){}})();`;

const bodyClass = css({
  fontFamily: 'sans',
  fontSmoothing: 'antialiased',
  overflowWrap: 'anywhere',
  '&::selection': {
    background: 'hsl(250 85% 65% / 0.24)',
    color: 'hsl(0 0% 100%)',
  },
});

const mainClass = css({
  margin: '0 auto',
  padding: '2rem',
  paddingTop: '6rem',
  width: '100%',
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'theme-color',
        content: '#0f0a24',
      },
      {
        name: 'description',
        content:
          'ev/agent — route, charge, and wander with your electric vehicle.',
      },
      {
        title: 'ev/agent',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'alternate icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo192.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className={bodyClass}>
        <ClerkProvider>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <main className={mainClass}>{children}</main>
              <TanStackDevtools
                config={{
                  position: 'bottom-right',
                }}
                plugins={[
                  {
                    name: 'Tanstack Router',
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                  {
                    name: 'React Query',
                    render: <ReactQueryDevtools />,
                  },
                ]}
              />
              <Scripts />
            </QueryClientProvider>
          </trpc.Provider>
        </ClerkProvider>
      </body>
    </html>
  );
}
