import { ArgumentsHost, ForbiddenException, Logger } from '@nestjs/common';

import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();
  const response = {
    headersSent: false,
    status: vi.fn(),
    json: vi.fn(),
  };
  const request = { originalUrl: '/job' };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    vi.clearAllMocks();
    response.status.mockReturnValue(response);
  });

  it('returns a readable forbidden response for unauthorized roles', () => {
    filter.catch(
      new ForbiddenException(
        'Only employers can create job listings.',
      ),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Only employers can create job listings.',
        error: 'Forbidden',
        path: '/job',
      }),
    );
  });

  it('returns a safe server error and logs unexpected exceptions', () => {
    const loggerError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    filter.catch(new Error('database connection details'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        path: '/job',
      }),
    );
    expect(response.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: 'database connection details' }),
    );
    expect(loggerError).toHaveBeenCalled();
  });

  it('does not attempt to write a response after headers have been sent', () => {
    response.headersSent = true;

    filter.catch(new ForbiddenException(), host);

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).not.toHaveBeenCalled();
    response.headersSent = false;
  });
});
