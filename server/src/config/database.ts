import 'dotenv/config';
import * as os from 'os';
import { MongoClient } from 'mongodb';
import { logger } from './logger';

const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017';
const dbName = process.env.DATABASE_NAME || 'app';

export const client = new MongoClient(uri, { runtimeAdapters: { os } });

export function getDb() {
  return client.db(dbName);
}

export async function connectDatabase() {
  await client.connect();
  const db = getDb();

  // Create indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ status: 1 });
  await db.collection('projects').createIndex({ createdBy: 1 });
  await db.collection('project_members').createIndex({ projectId: 1, userId: 1 }, { unique: true });
  await db.collection('tasks').createIndex({ projectId: 1, status: 1 });
  await db.collection('refresh_tokens').createIndex({ userId: 1 });
  await db.collection('refresh_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  logger.info('MongoDB connected & indexes ensured');
  return db;
}

