import 'reflect-metadata';
import { ROLES_KEY } from '../authentication/roles.decorator.js';
import { JobController } from './jobs.controller.js';

describe('JobController job creation access', () => {
  it('restricts job creation to verified-role employers', () => {
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        JobController.prototype.createJob,
      ),
    ).toEqual(['employer']);
  });
});
