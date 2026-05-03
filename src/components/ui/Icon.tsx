import type { LucideIcon, LucideProps } from 'lucide-react';
import { cx } from '#/styled-system/css';
import { icon } from '#/styled-system/recipes';

type BaseIconProps = Omit<LucideProps, 'color' | 'size'>;

export type IconProps = BaseIconProps &
  Parameters<typeof icon>[0] & {
    icon: LucideIcon;
    label?: string;
    title?: string;
    strokeWidth?: number;
  };

export default function Icon(props: IconProps) {
  const [recipeProps, localProps] = icon.splitVariantProps(props);
  const {
    icon: IconComponent,
    className,
    label,
    title,
    strokeWidth = 2,
    ...rest
  } = localProps;

  const ariaLabel = label || title;
  const isDecorative = !ariaLabel;

  return (
    <IconComponent
      className={cx(icon(recipeProps), className)}
      strokeWidth={strokeWidth}
      role={isDecorative ? undefined : 'img'}
      aria-hidden={isDecorative ? 'true' : undefined}
      aria-label={ariaLabel}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
    </IconComponent>
  );
}
