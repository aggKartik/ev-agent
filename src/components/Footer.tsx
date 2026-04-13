import { css } from '../../styled-system/css';

const footerClass = css({
  marginTop: '5rem',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'var(--line)',
  paddingInline: '1rem',
  paddingTop: '2.5rem',
  paddingBottom: '3.5rem',
  color: 'var(--sea-ink-soft)',
});

const containerClass = css({
  marginInline: 'auto',
  maxWidth: '72rem',
  display: 'flex',
  flexDirection: { base: 'column', sm: 'row' },
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  textAlign: { base: 'center', sm: 'left' },
});

const copyrightClass = css({
  margin: '0',
  fontSize: '0.875rem',
});

const kickerClass = css({
  margin: '0',
  color: 'var(--sea-ink-soft)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
});

const linksRowClass = css({
  marginTop: '1rem',
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem',
});

const iconLinkClass = css({
  borderRadius: '0.75rem',
  padding: '0.5rem',
  color: 'var(--sea-ink-soft)',
  transition: 'color 180ms ease, background-color 180ms ease',
  _hover: {
    background: 'var(--link-bg-hover)',
    color: 'var(--sea-ink)',
  },
});

const srOnlyClass = css({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
});

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={footerClass}>
      <div className={containerClass}>
        <p className={copyrightClass}>
          &copy; {year} Your name here. All rights reserved.
        </p>
        <p className={kickerClass}>Built with TanStack Start</p>
      </div>
      <div className={linksRowClass}>
        <a
          href="https://x.com/tan_stack"
          target="_blank"
          rel="noreferrer"
          className={iconLinkClass}
        >
          <span className={srOnlyClass}>Follow TanStack on X</span>
          <svg viewBox="0 0 16 16" aria-hidden="true" width="32" height="32">
            <path
              fill="currentColor"
              d="M12.6 1h2.2L10 6.48 15.64 15h-4.41L7.78 9.82 3.23 15H1l5.14-5.84L.72 1h4.52l3.12 4.73L12.6 1zm-.77 12.67h1.22L4.57 2.26H3.26l8.57 11.41z"
            />
          </svg>
        </a>
        <a
          href="https://github.com/TanStack"
          target="_blank"
          rel="noreferrer"
          className={iconLinkClass}
        >
          <span className={srOnlyClass}>Go to TanStack GitHub</span>
          <svg viewBox="0 0 16 16" aria-hidden="true" width="32" height="32">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
        </a>
      </div>
    </footer>
  );
}
