import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '#/lib/trpc';
import { css } from '../../styled-system/css';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const hello = trpc.example.hello.useQuery({ name: 'ev-agent' });

  return (
    <main
      className={css({
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
      })}
    >
      <section
        className={css({
          padding: '3rem',
          borderRadius: '1rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          marginBottom: '2rem',
        })}
      >
        <h1
          className={css({
            fontSize: '3xl',
            fontWeight: 'bold',
            marginBottom: '1rem',
          })}
        >
          Welcome to ev-agent
        </h1>
        <p className={css({ fontSize: 'lg', opacity: 0.9 })}>
          A modern full-stack application built with:
        </p>
        <ul
          className={css({
            marginTop: '1rem',
            listStyle: 'disc',
            paddingLeft: '2rem',
          })}
        >
          <li>TanStack Start - Full-stack React framework</li>
          <li>Bun - Fast JavaScript runtime</li>
          <li>tRPC - End-to-end type-safe APIs</li>
          <li>TanStack Query - Data fetching & caching</li>
          <li>Ark UI - Headless component library</li>
          <li>Panda CSS - CSS-in-JS styling</li>
          <li>Biome - Fast linting & formatting</li>
        </ul>
      </section>

      <section
        className={css({
          padding: '2rem',
          borderRadius: '0.5rem',
          border: '1px solid',
          borderColor: 'gray.200',
          background: 'white',
          boxShadow: 'sm',
        })}
      >
        <h2
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
            marginBottom: '1rem',
          })}
        >
          tRPC Integration Test
        </h2>
        <div
          className={css({
            padding: '1rem',
            background: 'gray.50',
            borderRadius: '0.25rem',
            fontFamily: 'monospace',
          })}
        >
          {hello.isLoading ? (
            <p>Loading...</p>
          ) : hello.error ? (
            <p className={css({ color: 'red.500' })}>
              Error: {hello.error.message}
            </p>
          ) : (
            <p className={css({ fontSize: 'lg', color: 'green.600' })}>
              ✓ {hello.data}
            </p>
          )}
        </div>
        <p
          className={css({
            marginTop: '1rem',
            fontSize: 'sm',
            color: 'gray.600',
          })}
        >
          This message is fetched from the tRPC server with full type safety.
        </p>
      </section>

      <section
        className={css({
          marginTop: '2rem',
          padding: '2rem',
          borderRadius: '0.5rem',
          background: 'blue.50',
          border: '1px solid',
          borderColor: 'blue.200',
        })}
      >
        <h2
          className={css({
            fontSize: 'xl',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: 'blue.900',
          })}
        >
          Next Steps
        </h2>
        <ul
          className={css({
            listStyle: 'decimal',
            paddingLeft: '2rem',
            color: 'blue.800',
            '& li': { marginBottom: '0.5rem' },
          })}
        >
          <li>Add more tRPC routers in src/server/routers/</li>
          <li>Create components using Ark UI primitives</li>
          <li>Style components with Panda CSS recipes</li>
          <li>Add new routes in src/routes/</li>
          <li>Configure environment variables in .env</li>
        </ul>
      </section>
    </main>
  );
}
