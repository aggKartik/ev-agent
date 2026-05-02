import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

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

export interface CarTable {
  id: Generated<number>;
  name: string;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface UserCarTable {
  userId: number;
  carId: number;
  createdAt: ColumnType<Date, string | undefined, never>;
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
  cars: CarTable;
  userCars: UserCarTable;
  oauthAccounts: OAuthAccountTable;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Car = Selectable<CarTable>;
export type NewCar = Insertable<CarTable>;
export type CarUpdate = Updateable<CarTable>;

export type UserCar = Selectable<UserCarTable>;
export type NewUserCar = Insertable<UserCarTable>;
export type UserCarUpdate = Updateable<UserCarTable>;

export type OAuthAccount = Selectable<OAuthAccountTable>;
export type NewOAuthAccount = Insertable<OAuthAccountTable>;
export type OAuthAccountUpdate = Updateable<OAuthAccountTable>;
