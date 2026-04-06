import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '#/lib/trpc';
import { css } from '../../styled-system/css';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const _hello = trpc.example.hello.useQuery({ name: 'ev-agent' });

  return (
    <main
      className={css({
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
      })}
    >
      <h1 className={css({ fontSize: '2rem', fontWeight: 'bold' })}>
        Welcome to EV Agent!
      </h1>
    </main>
  );
}
