import { ark } from '@ark-ui/react/factory';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { css, cx } from '../../styled-system/css';
import { button } from '../../styled-system/recipes';

const contentClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'xs',
});

const spinnerClass = css({
  display: 'inline-block',
  width: '1em',
  height: '1em',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderRadius: 'full',
  borderColor: 'currentColor',
  borderRightColor: 'transparent',
});

export type ButtonProps = Omit<
  ComponentPropsWithoutRef<typeof ark.button>,
  'color'
> &
  Parameters<typeof button>[0] & {
    loading?: boolean;
    loadingText?: ReactNode;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
  };

export default function Button(props: ButtonProps) {
  const [recipeProps, localProps] = button.splitVariantProps(props);
  const {
    className,
    children,
    disabled,
    loading,
    loadingText,
    leadingIcon,
    trailingIcon,
    ...rest
  } = localProps;

  const isDisabled = Boolean(disabled || loading);

  return (
    <ark.button
      type="button"
      className={cx(button(recipeProps), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-loading={loading ? '' : undefined}
      {...rest}
    >
      <span className={contentClass}>
        {loading ? (
          <span
            className={spinnerClass}
            data-part="spinner"
            data-icon="true"
            aria-hidden="true"
          />
        ) : (
          <span data-part="leading-icon" data-icon="true">
            {leadingIcon}
          </span>
        )}
        <span>{loading && loadingText ? loadingText : children}</span>
        {!loading ? (
          <span data-part="trailing-icon" data-icon="true">
            {trailingIcon}
          </span>
        ) : null}
      </span>
    </ark.button>
  );
}
