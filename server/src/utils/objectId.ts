import { ObjectId } from 'mongodb';

/**
 * Parse a string into an ObjectId, returning null when the input is not a valid
 * 24-hex-character ObjectId. Centralizes the try/catch pattern repeated across
 * services and controllers.
 */
export function parseObjectId(value: string | unknown): ObjectId | null {
  if (typeof value !== 'string') return null;
  if (!/^[0-9a-fA-F]{24}$/.test(value)) return null;
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}