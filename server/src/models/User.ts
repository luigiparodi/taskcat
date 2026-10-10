import { ObjectId } from 'mongodb';
import { getDb } from '../config/database';

export type UserProvider = 'github' | 'email' | null;
export type UserRole = 'admin' | 'worker';
export type UserStatus = 'active' | 'inactive' | 'deleted';

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  timezone: string;
}

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  avatarUrl?: string;
  passwordHash?: string;
  provider: UserProvider;
  providerId?: string;
  role: UserRole;
  status: UserStatus;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const USERS_COLLECTION = 'users';

export function getUserCollection() {
  return getDb().collection<User>(USERS_COLLECTION);
}


