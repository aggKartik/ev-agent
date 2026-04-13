import { Stack } from 'styled-system/jsx';
import { css } from '../../styled-system/css';
import EVAgentLogo from './EVAgentLogo';

const headerClass = css({
  position: 'fixed',
  top: '0',
  left: '0',
  right: '0',
  zIndex: '50',
  background: 'var(--header-bg)',
  paddingInline: '1rem',
  paddingBlock: '0.75rem',
  minHeight: '4rem',
  backdropFilter: 'blur(16px)',
});

export default function Header() {
  return (
    <header className={headerClass}>
      <Stack direction="row" align="center" justify="between">
        <EVAgentLogo />
      </Stack>
    </header>
  );
}
