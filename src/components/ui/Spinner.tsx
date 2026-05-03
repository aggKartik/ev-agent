import { css, cx } from '#/styled-system/css';

const spinnerClass = css({
  display: 'inline-block',
  width: '1em',
  height: '1em',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderRadius: 'full',
  borderColor: 'currentColor',
  borderRightColor: 'transparent',
  animation: 'spin 1s linear infinite',
});

type SpinnerProps = {
  size?: string;
  className?: string;
  label?: string;
};

export default function Spinner({
  size = '1em',
  className,
  label = 'Loading',
}: SpinnerProps) {
  return (
    <output
      className={cx(spinnerClass, className)}
      aria-label={label}
      style={{ fontSize: size }}
    />
  );
}
