import { Show, useClerk } from '@clerk/tanstack-react-start';
import { Box } from 'styled-system/jsx';
import { css } from '../../styled-system/css';
import EVAgentLogo from './EVAgentLogo';

const headerClass = css({
  position: 'relative',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingInline: { base: '5', md: '10' },
  paddingTop: { base: '5', md: '6' },
  paddingBottom: '3.5',
  flexShrink: 0,
});

const rightGroupClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: { base: '3', md: '5' },
});

const metaClass = css({
  display: { base: 'none', md: 'flex' },
  alignItems: 'center',
  gap: '4',
  fontFamily: 'mono',
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'cream.600',
});

const dotClass = css({
  width: '6px',
  height: '6px',
  borderRadius: 'full',
  background: 'lime.300',
  boxShadow: '0 0 10px {colors.lime.300}',
  animation: 'pulse 1.6s ease-in-out infinite',
});

const metaSeparatorClass = css({
  color: 'cream.200',
  opacity: 0.6,
});

const signOutButtonClass = css({
  fontFamily: 'mono',
  fontSize: '11px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'cream.200',
  background: 'transparent',
  border: '1px solid {colors.alpha.cream-28}',
  borderRadius: 'pill',
  paddingInline: '3.5',
  paddingBlock: '1.5',
  cursor: 'pointer',
  transition: 'background fast ease-out, border-color fast ease-out',
  _hover: {
    background: 'alpha.cream-06',
    borderColor: 'peach.400',
  },
});

type HeaderProps = {
  sessionLabel?: string;
  buildLabel?: string;
  showMeta?: boolean;
};

function SignOutControl() {
  const clerk = useClerk();

  const handleSignOut = () => {
    void clerk.signOut({ redirectUrl: '/' });
  };

  return (
    <button
      type="button"
      className={signOutButtonClass}
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}

export default function Header({
  sessionLabel = 'SESSION · 00/00',
  buildLabel = 'v1.0 BETA',
  showMeta = true,
}: HeaderProps) {
  return (
    <header className={headerClass}>
      <EVAgentLogo showSub />
      <Box className={rightGroupClass}>
        {showMeta ? (
          <Box className={metaClass}>
            <Box as="span" className={dotClass} />
            <Box as="span">{sessionLabel}</Box>
            <Box as="span" className={metaSeparatorClass}>
              ·
            </Box>
            <Box as="span">{buildLabel}</Box>
          </Box>
        ) : null}
        <Show when="signed-in">
          <SignOutControl />
        </Show>
      </Box>
    </header>
  );
}
