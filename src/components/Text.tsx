import type { ElementType } from 'react';
import type { BoxProps } from 'styled-system/jsx';
import { Box } from 'styled-system/jsx';
import type {
  TypographySizeToken,
  TypographyWeightToken,
} from '../styles/tokens/typography';

type TextSize = TypographySizeToken;
type TextWeight = TypographyWeightToken;

export type TextProps<T extends ElementType = 'p'> = Omit<
  BoxProps,
  'as' | 'fontSize' | 'fontWeight'
> & {
  as?: T;
  size?: TextSize;
  weight?: TextWeight;
};

export function Text<T extends ElementType = 'p'>(props: TextProps<T>) {
  const { as = 'p' as T, size = 'md', weight = 'normal', ...rest } = props;

  return <Box as={as} fontSize={size} fontWeight={weight} {...rest} />;
}
