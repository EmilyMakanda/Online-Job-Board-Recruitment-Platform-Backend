import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../authentication/entities/user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const userRepo = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    findOneByOrFail: vi.fn(),
    find: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a jobseeker using the shared user entity and role', async () => {
    userRepo.findOne.mockResolvedValue(null);
    userRepo.create.mockImplementation((user) => user);
    userRepo.save.mockImplementation(async (user) => ({ id: 1, ...user }));
    userRepo.findOneByOrFail.mockResolvedValue({ id: 1, role: 'job_seeker' });

    await service.createJobseeker({
      fullName: 'Alex Smith',
      email: 'alex@example.com',
      password: 'StrongPass123!',
    });

    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alex Smith',
        email: 'alex@example.com',
        role: 'job_seeker',
      }),
    );
    expect(userRepo.findOneByOrFail).toHaveBeenCalledWith({ id: 1 });
  });

  it('lists only employer accounts for the employer endpoint', async () => {
    userRepo.find.mockResolvedValue([]);

    await service.findAllEmployers();

    expect(userRepo.find).toHaveBeenCalledWith({
      where: { role: 'employer' },
    });
  });
});
