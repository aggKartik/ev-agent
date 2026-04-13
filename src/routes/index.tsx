import { createFileRoute } from '@tanstack/react-router';
import { css } from '../../styled-system/css';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <h1 className={css({ fontSize: '2rem', fontWeight: 'bold' })}>
      Welcome to EV Agent!
    </h1>
  );
}
