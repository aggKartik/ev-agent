import { ark } from '@ark-ui/react/factory';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Spinner from '#/components/Spinner';
import { css, cx } from '../../styled-system/css';
import { button } from '../../styled-system/recipes';

const contentClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
});

export type ButtonProps = Omit<
  ComponentPropsWithoutRef<typeof ark.button>,
  'color'
> &
  Parameters<typeof button>[0] & {
    unstyled?: boolean;
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
    unstyled,
    loading,
    loadingText,
    leadingIcon,
    trailingIcon,
    type,
    ...rest
  } = localProps;

  const isDisabled = Boolean(disabled || loading);

  return (
    <ark.button
      type={type ?? 'button'}
      className={cx(unstyled ? undefined : button(recipeProps), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-loading={loading ? '' : undefined}
      {...rest}
    >
      <span className={contentClass}>
        {loading ? (
          <span data-part="spinner" data-icon="true" aria-hidden="true">
            <Spinner />
          </span>
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
