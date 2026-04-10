import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface UserTable {
  id: Generated<number>;
  email: string;
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

export interface Database {
  users: UserTable;
  cars: CarTable;
  userCars: UserCarTable;
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
