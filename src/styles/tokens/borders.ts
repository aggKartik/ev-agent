export const borderWidths = {
  '0': { value: '0px' },
  hair: { value: '1px' },
  thin: { value: '1.5px' },
  med: { value: '2px' },
  thick: { value: '3px' },
};

export const borders = {
  subtle: { value: '{borderWidths.hair} solid {colors.alpha.cream-12}' },
  default: { value: '{borderWidths.hair} solid {colors.alpha.cream-18}' },
  strong: { value: '{borderWidths.hair} solid {colors.alpha.cream-28}' },
  accent: { value: '{borderWidths.med} solid {colors.peach.400}' },
  focus: { value: '{borderWidths.med} solid {colors.peach.300}' },
  dashed: { value: '{borderWidths.hair} dashed {colors.alpha.cream-18}' },
};
