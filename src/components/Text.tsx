import type { CSSProperties, ElementType } from 'react';
import type { BoxProps } from 'styled-system/jsx';
import { Box } from 'styled-system/jsx';
import type {
  TypographySizeToken,
  TypographyWeightToken,
} from '../styles/tokens/typography';
import { fontSizes, fontWeights } from '../styles/tokens/typography';

type TextSize = TypographySizeToken;
type TextWeight = TypographyWeightToken;

export type TextProps = Omit<BoxProps, 'as' | 'size'> & {
  as?: ElementType;
  size?: TextSize;
  weight?: TextWeight;
  fontSize?: BoxProps['fontSize'];
  fontWeight?: BoxProps['fontWeight'];
};

export function Text(props: TextProps) {
  const {
    as = 'p',
    size = 'md',
    weight = 'normal',
    fontSize,
    fontWeight,
    style,
    ...rest
  } = props;

  const resolvedFontSize = fontSize ?? size;
  const resolvedFontWeight = fontWeight ?? weight;
  const inlineFontSize = resolveFontSize(resolvedFontSize);
  const inlineFontWeight = resolveFontWeight(resolvedFontWeight);

  const resolvedStyle: CSSProperties = Object.assign(
    {},
    style as CSSProperties | undefined,
  );

  if (inlineFontSize !== undefined) {
    resolvedStyle.fontSize = inlineFontSize;
  }

  if (inlineFontWeight !== undefined) {
    resolvedStyle.fontWeight = inlineFontWeight;
  }

  return <Box as={as} style={resolvedStyle} {...rest} />;
}

function resolveFontSize(
  value: unknown,
): CSSProperties['fontSize'] | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (value in fontSizes) {
    return `var(--font-sizes-${value})`;
  }

  return value;
}

function resolveFontWeight(
  value: unknown,
): CSSProperties['fontWeight'] | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (value in fontWeights) {
    return `var(--font-weights-${value})`;
  }

  return value;
}
