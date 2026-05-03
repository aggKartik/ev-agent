import type { ElementType } from 'react';
import type { BoxProps } from 'styled-system/jsx';
import { Box } from 'styled-system/jsx';

export type TextProps = Omit<BoxProps, 'as'> & {
  as?: ElementType;
  variant?: BoxProps['textStyle'];
};

export function Text(props: TextProps) {
  const { as = 'p', variant, ...rest } = props;

  return <Box as={as} textStyle={variant} {...rest} />;
}
