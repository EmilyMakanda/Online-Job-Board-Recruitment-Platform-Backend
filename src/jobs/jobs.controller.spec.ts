import { ROLES_KEY } from '../authentication/roles.decorator.js';
import { JobController } from './jobs.controller.js';

describe('JobController administrator review access', () => {
  it('restricts pending-review and review decisions to administrators', () => {
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        JobController.prototype.getPendingJobsForReview,
      ),
    ).toEqual(['admin']);
    expect(
      Reflect.getMetadata(ROLES_KEY, JobController.prototype.approveJob),
    ).toEqual(['admin']);
    expect(
      Reflect.getMetadata(ROLES_KEY, JobController.prototype.rejectJob),
    ).toEqual(['admin']);
  });
});
