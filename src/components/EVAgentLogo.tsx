import { Box, Stack } from 'styled-system/jsx';
import { css } from '../../styled-system/css';
import { Text } from './Text';

const logoIconClass = css({
  color: 'primary.500',
});

const EVAgentLogo = () => {
  return (
    <Stack direction="row" alignItems="center" gap={2}>
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="24"
        aria-hidden="true"
        focusable="false"
        className={logoIconClass}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
      <Box display="flex" alignItems="center">
        <Text color="white">ev</Text>
        <Text color="primary.500">agent</Text>
      </Box>
    </Stack>
  );
};

export default EVAgentLogo;
