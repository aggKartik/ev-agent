import type { ColumnType, Generated } from 'kysely';

/**
 * Internal source of truth for every user. External identity providers
 * (Clerk today, anything else tomorrow) are referenced by columns like
 * `clerkUserId`, never used as the primary key for other tables.
 */
export interface UserTable {
  id: Generated<number>;
  clerkUserId: string | null;
  email: string | null;
  createdAt: ColumnType<Date, string | undefined, never>;
}

/**
 * The persisted **Vehicle** row, 1:1 with `users`. Identity columns are
 * Tesla-authoritative when linked, manual otherwise. Catalog-derivable
 * energy facts are not stored here — see
 * `src/server/capabilities/vehicles/domain/resolveEnergyProfile.ts` for the
 * read-time merger over `(override -> catalog -> default)`.
 */
export interface VehicleTable {
  id: Generated<number>;
  userId: number;
  make: string;
  model: string;
  year: string;
  vin: string | null;
  teslaVehicleId: string | null;
  targetArrivalSocPercent: number;
  postChargeSocPercent: number;
  overrideUsableRangeMiles: number | null;
  overrideBatteryCapacityKwh: number | null;
  overrideConsumptionWhPerMile: number | null;
  /** Stored as JSONB; always read as `EvConnectorSlug[]` after parsing. */
  overrideConnectorTypes: string[] | null;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

/**
 * A single row represents a user's link to one remote OAuth provider.
 * `provider` is the discriminator (e.g. 'tesla'); composite unique index
 * on (provider, userId) enforces one account per user per provider.
 * `userId` is the internal FK into `users.id` — never a Clerk id.
 */
export interface OAuthAccountTable {
  id: Generated<number>;
  provider: string;
  userId: number;
  remoteAccountId: string | null;
  accessTokenCiphertext: Buffer;
  accessTokenIv: Buffer;
  accessTokenTag: Buffer;
  refreshTokenCiphertext: Buffer;
  refreshTokenIv: Buffer;
  refreshTokenTag: Buffer;
  scope: string;
  expiresAt: ColumnType<Date, Date | string, Date | string>;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export interface Database {
  users: UserTable;
  vehicles: VehicleTable;
  oauthAccounts: OAuthAccountTable;
}
