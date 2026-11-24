import { BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { DataSource } from 'typeorm';
import { User } from '../../authentication/entities/user.entity.js';

export interface AdminSeedConfig {
  name?: string;
  email?: string;
  password?: string;
}

export type AdminSeedResult =
  | { status: 'created'; userId: number }
  | { status: 'already-exists'; userId: number };

export async function seedAdmin(
  dataSource: DataSource,
  config: AdminSeedConfig,
): Promise<AdminSeedResult> {
  if (!dataSource.isInitialized) {
    throw new Error('The database connection must be initialized first.');
  }

  return dataSource.transaction(async (manager) => {
    const userRepository = manager.getRepository(User);
    const existingAdmin = await userRepository.findOne({
      where: { role: 'admin' },
      select: { id: true, isActive: true, isEmailVerified: true },
    });

    if (existingAdmin) {
      if (existingAdmin.isActive !== 1 || existingAdmin.isEmailVerified !== 1) {
        throw new ConflictException(
          'An administrator already exists but is inactive or unverified. No account was changed.',
        );
      }

      return { status: 'already-exists', userId: existingAdmin.id };
    }

    const name = config.name?.trim() || 'System Administrator';
    const email = config.email?.trim().toLowerCase();
    const password = config.password;

    if (!email || !password) {
      throw new BadRequestException(
        'ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required when no administrator exists.',
      );
    }

    if (name.length > 100) {
      throw new BadRequestException(
        'ADMIN_SEED_NAME must be at most 100 characters.',
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException(
        'ADMIN_SEED_EMAIL must be a valid email address.',
      );
    }

    if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException(
        'ADMIN_SEED_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes.',
      );
    }

    const existingAccount = await userRepository.findOne({
      where: { email },
      select: { id: true },
    });

    if (existingAccount) {
      throw new ConflictException(
        'ADMIN_SEED_EMAIL belongs to an existing non-admin account. No account was changed.',
      );
    }

    const admin = userRepository.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'admin',
      isEmailVerified: 1,
      isActive: 1,
      phone: null,
      resumeUrl: null,
      location: null,
      skills: null,
      companyId: null,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    });

    const savedAdmin = await userRepository.save(admin);
    return { status: 'created', userId: savedAdmin.id };
  });
}
