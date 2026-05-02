import { Box } from 'styled-system/jsx';

type RouteMapEmptyStateProps = {
  className: string;
};

export default function RouteMapEmptyState({
  className,
}: RouteMapEmptyStateProps) {
  return <Box className={className}>SELECT A DESTINATION TO PREVIEW</Box>;
}
