import { FlaskConical } from 'lucide-react';
import Button, { type ButtonProps } from '#/components/Button';

type TestUserButtonProps = Omit<ButtonProps, 'variant' | 'leadingIcon'> & {
  label?: string;
};

export default function TestUserButton({
  label = 'Continue as test user',
  ...rest
}: TestUserButtonProps) {
  return (
    <Button
      variant="ghost"
      leadingIcon={<FlaskConical size={16} aria-hidden="true" />}
      data-testid="test-user-button"
      {...rest}
    >
      {label}
    </Button>
  );
}
