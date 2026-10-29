import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttpException) {
      this.logger.error(
        'Unhandled request exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : undefined;
    const responseObject =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : undefined;
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : responseObject &&
            'message' in responseObject &&
            (typeof responseObject.message === 'string' ||
              Array.isArray(responseObject.message))
          ? responseObject.message
          : isHttpException
            ? exception.message
            : 'Internal server error';
    const error =
      responseObject &&
      'error' in responseObject &&
      typeof responseObject.error === 'string'
        ? responseObject.error
        : (HttpStatus[statusCode]
            ?.replaceAll('_', ' ')
            .toLowerCase()
            .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()) ??
          'Error');

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }
}
