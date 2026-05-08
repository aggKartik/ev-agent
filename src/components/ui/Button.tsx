import { ark } from '@ark-ui/react/factory';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Spinner from '#/components/ui/Spinner';
import { css, cx } from '#/styled-system/css';
import { button } from '#/styled-system/recipes';

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
    iconOnly?: boolean;
    contentMode?: 'default' | 'custom';
  };

function SpinnerIcon() {
  return (
    <span data-part="spinner" data-icon="true" aria-hidden="true">
      <Spinner />
    </span>
  );
}

function renderLeadingIcon(loading: boolean, icon: ReactNode) {
  if (loading) return <SpinnerIcon />;
  if (!icon) return null;
  return (
    <span data-part="leading-icon" data-icon="true">
      {icon}
    </span>
  );
}

function renderTrailingIcon(loading: boolean, icon: ReactNode) {
  if (loading || !icon) return null;
  return (
    <span data-part="trailing-icon" data-icon="true">
      {icon}
    </span>
  );
}

function renderLabel(
  loading: boolean,
  loadingText: ReactNode,
  children: ReactNode,
) {
  return loading && loadingText ? loadingText : children;
}

function DefaultContent({
  loading,
  loadingText,
  leadingIcon,
  trailingIcon,
  children,
}: {
  loading: boolean;
  loadingText: ReactNode;
  leadingIcon: ReactNode;
  trailingIcon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className={contentClass}>
      {renderLeadingIcon(loading, leadingIcon)}
      <span>{renderLabel(loading, loadingText, children)}</span>
      {renderTrailingIcon(loading, trailingIcon)}
    </span>
  );
}

function CustomContent({
  loading,
  children,
}: {
  loading: boolean;
  children: ReactNode;
}) {
  if (!loading) return <>{children}</>;
  return (
    <span className={contentClass}>
      <SpinnerIcon />
    </span>
  );
}

function buildBaseButtonProps(args: {
  recipeProps: Parameters<typeof button>[0];
  className: string | undefined;
  unstyled: boolean | undefined;
  disabled: boolean | undefined;
  isLoading: boolean;
  type: ButtonProps['type'];
}) {
  const { recipeProps, className, unstyled, disabled, isLoading, type } = args;
  return {
    type: type ?? 'button',
    className: cx(unstyled ? undefined : button(recipeProps), className),
    disabled: Boolean(disabled || isLoading),
    'aria-busy': isLoading || undefined,
    'data-loading': isLoading ? '' : undefined,
  } as const;
}

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
    iconOnly,
    contentMode = 'default',
    type,
    ...rest
  } = localProps;

  const isLoading = Boolean(loading);
  const isCustom = Boolean(iconOnly) || contentMode === 'custom';
  const buttonProps = buildBaseButtonProps({
    recipeProps,
    className,
    unstyled,
    disabled,
    isLoading,
    type,
  });

  if (isCustom) {
    return (
      <ark.button
        {...buttonProps}
        data-icon-only={iconOnly ? '' : undefined}
        data-content-mode={contentMode === 'custom' ? 'custom' : undefined}
        {...rest}
      >
        <CustomContent loading={isLoading}>{children}</CustomContent>
      </ark.button>
    );
  }

  return (
    <ark.button {...buttonProps} {...rest}>
      <DefaultContent
        loading={isLoading}
        loadingText={loadingText}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
      >
        {children}
      </DefaultContent>
    </ark.button>
  );
}
