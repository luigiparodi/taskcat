import multer from 'multer';

export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

export const uploadImportFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMPORT_FILE_BYTES },
});