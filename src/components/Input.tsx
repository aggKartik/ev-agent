import { ark } from '@ark-ui/react/factory';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cx } from '../../styled-system/css';
import { input } from '../../styled-system/recipes';

export type InputProps = ComponentPropsWithoutRef<typeof ark.input> &
  Parameters<typeof input>[0];

const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(props, ref) {
    const [recipeProps, localProps] = input.splitVariantProps(props);
    const { className, ...rest } = localProps;

    return (
      <ark.input
        ref={ref}
        className={cx(input(recipeProps), className)}
        {...rest}
      />
    );
  },
);

export default Input;
