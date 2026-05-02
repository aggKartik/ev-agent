export type DashboardTone = 'peach' | 'lime' | 'magenta' | 'violet' | 'muted';

export type DashboardTeslaState = 'unlinked' | 'linked' | 'offline' | 'error';

export type DashboardTeslaVehicle = {
  id: string;
  vin: string | null;
  displayName: string;
  model: string | null;
  year: string | null;
  state: string | null;
  batteryLevel: number | null;
  rangeMi: number | null;
  odometerMi: number | null;
  chargeLimitSoc: number | null;
};

export type DashboardTeslaSummary = {
  status: DashboardTeslaState;
  label: string;
  detail: string;
  linked: boolean;
  scopes: string[];
  vehicle: DashboardTeslaVehicle | null;
  refreshedAt: string | null;
};

export type DashboardQuickDestination = {
  id: string;
  label: string;
  sub: string;
  tone: Exclude<DashboardTone, 'muted'>;
};

export type DashboardRecentTrip = {
  id: string;
  title: string;
  when: string;
  miles: number;
  duration: string;
  stops: number;
  chargeStops: number;
  from: string;
  to: string;
  activities: string[];
  status: 'completed' | 'planned';
  tone: Exclude<DashboardTone, 'muted'>;
};

export type DashboardActivityEvent = {
  id: string;
  time: string;
  message: string;
  tone: DashboardTone;
};

export type DashboardUtilityTile = {
  id: string;
  kicker: string;
  title: string;
  sub: string;
  tone: Exclude<DashboardTone, 'muted'>;
  action: 'plan' | 'tesla-connect' | 'none';
};

export type DashboardSummary = {
  generatedAt: string;
  profile: {
    firstName: string | null;
    driverLabel: string;
  };
  tesla: DashboardTeslaSummary;
  quickDestinations: DashboardQuickDestination[];
  recentTrips: DashboardRecentTrip[];
  activityFeed: DashboardActivityEvent[];
  utilities: DashboardUtilityTile[];
};
