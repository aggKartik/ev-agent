import { ArrowRight } from 'lucide-react';
import { Box } from 'styled-system/jsx';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { Text } from '@/components/Text';
import { css } from '../../../styled-system/css';

const containerClass = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'sm',
});

const IntroStep = () => {
  return (
    <div className={containerClass}>
      <Text
        as="h1"
        animationStyle="introTitle"
        size="5xl"
        weight="bold"
        color="text.default"
        mb="sm"
      >
        First, tell us about your car
      </Text>

      <Text
        as="p"
        animationStyle="introBody"
        size="md"
        lineHeight="relaxed"
        color="text.subtle"
        maxWidth="24rem"
        mb="xl"
      >
        We'll use your vehicle details to plan your trip around what YOU want to
        do!
      </Text>
      <Box animationStyle="introButton">
        <Button
          trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
        >
          Get Started
        </Button>
      </Box>
    </div>
  );
};

export default IntroStep;
