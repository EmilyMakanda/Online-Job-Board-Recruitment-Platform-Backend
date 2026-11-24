import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';

const uploadDirectory = 'uploads/applications';

mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = [
  '.pdf',
  '.txt',
  '.doc',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
];

const allowedMimeTypes = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

export const applicationUploadOptions = {
  storage: diskStorage({
    destination: uploadDirectory,

    filename: (_req, file, callback) => {
      const uniqueName =
        `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
        extname(file.originalname).toLowerCase();

      callback(null, uniqueName);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 7, // CV + cover letter + maximum 5 supporting files
  },

  fileFilter: (_req: any, file: { originalname: string; mimetype: string; }, callback: (arg0: BadRequestException | null, arg1: boolean) => void) => {
    const extension = extname(file.originalname).toLowerCase();

    if (
      !allowedExtensions.includes(extension) ||
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      return callback(
        new BadRequestException(
          'Unsupported document format. Upload PDF, TXT, DOC, DOCX, JPG or PNG files.',
        ),
        false,
      );
    }

    callback(null, true);
  },
};