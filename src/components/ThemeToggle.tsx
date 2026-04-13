import { css } from '../../styled-system/css';

const toggleButtonClass = css({
  borderRadius: '9999px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--chip-line)',
  background: 'var(--chip-bg)',
  paddingInline: '0.75rem',
  paddingBlock: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--sea-ink)',
  boxShadow: '0 8px 22px rgba(30, 90, 72, 0.08)',
  transition: 'transform 180ms ease',
  _hover: {
    transform: 'translateY(-2px)',
  },
});

export default function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Theme mode: dark"
      title="Theme mode: dark"
      disabled
      className={toggleButtonClass}
    >
      Dark
    </button>
  );
}
