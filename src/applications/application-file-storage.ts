import { Logger } from '@nestjs/common';
import { existsSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';

export const APPLICATION_UPLOAD_DIR = join(
  process.cwd(),
  'uploads',
  'applications',
);

const logger = new Logger('ApplicationFileStorage');

export function removeApplicationFiles(storedNames: readonly string[]): void {
  for (const storedName of storedNames) {
    const filePath = join(APPLICATION_UPLOAD_DIR, basename(storedName));
    if (!existsSync(filePath)) {
      continue;
    }

    try {
      unlinkSync(filePath);
    } catch (error) {
      logger.error(
        `Could not remove application document ${basename(storedName)}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
