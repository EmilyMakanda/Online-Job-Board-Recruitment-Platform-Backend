import {
  BadRequestException,
  Body,
  CallHandler,
  Controller,
  Delete,
  ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  Logger,
  NestInterceptor,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import type { Request, Response, Express } from 'express';
import { catchError, throwError } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles } from '../authentication/roles.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    role: 'job_seeker' | 'employer';
  };
}

const uploadDirectory = join(process.cwd(), 'uploads', 'applications');
mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set(['.pdf', '.txt']);
const allowedMimeTypes = new Set(['application/pdf', 'text/plain']);

@Injectable()
class CleanupUploadsOnErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CleanupUploadsOnErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { files?: Record<string, Express.Multer.File[]> }
      >();
    return next.handle().pipe(
      catchError((error: unknown) => {
        for (const file of Object.values(request.files ?? {}).flat()) {
          if (!file.path || !existsSync(file.path)) {
            continue;
          }
          try {
            unlinkSync(file.path);
          } catch (cleanupError) {
            this.logger.error(
              `Could not remove uploaded file ${file.filename}.`,
              cleanupError instanceof Error ? cleanupError.stack : undefined,
            );
          }
        }
        return throwError(() => error);
      }),
    );
  }
}

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const extension = extname(file.originalname).toLowerCase();
  if (
    !allowedExtensions.has(extension) ||
    !allowedMimeTypes.has(file.mimetype)
  ) {
    return callback(new BadRequestException('Invalid file type'), false);
  }
  callback(null, true);
}

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles('job_seeker')
  @ApiOperation({
    summary: 'Submit a job application with a CV and a supporting documents',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['jobId', 'cv'],
      properties: {
        jobId: { type: 'string', format: 'uuid' },
        coverLetter: { type: 'string', maxLength: 2000 },
        cv: { type: 'string', format: 'binary' },
        supportingDocuments: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cv', maxCount: 1 },
        { name: 'supportingDocuments', maxCount: 5 },
      ],
      {
        storage: diskStorage({
          destination: (_req, _file, callback) =>
            callback(null, uploadDirectory),
          filename: (_req, file, callback) =>
            callback(
              null,
              `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
            ),
        }),
        limits: { fileSize: 5 * 1024 * 1024, files: 6 },
        fileFilter,
      },
    ),
    new CleanupUploadsOnErrorInterceptor(),
  )
  create(
    @Body() dto: CreateApplicationDto,
    @UploadedFiles()
    files: {
      cv?: Express.Multer.File[];
      coverLetterFile?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
    },
    @Req() req: AuthenticatedRequest,
  ) {
    const cv = files?.cv?.[0];
    return this.applicationsService.create(
      dto,
      req.user.sub,
      cv,
      files?.supportingDocuments ?? [],
    );
  }

  @Get()
  @Roles('job_seeker')
  @ApiOperation({ summary: 'View the authenticated jobseeker applications' })
  findMine(@Req() req: AuthenticatedRequest) {
    return this.applicationsService.findByJobSeeker(req.user.sub);
  }

  @Get('employer')
  @Roles('employer')
  @ApiOperation({
    summary: 'View applications  submitted for jobs by this employer',
  })
  findForEmployer(@Req() req: AuthenticatedRequest) {
    return this.applicationsService.findByEmployer(req.user.sub);
  }

  @Get('job-seeker/:jobSeekerId')
  @Roles('job_seeker')
  findByJobSeeker(
    @Param('jobSeekerId', ParseIntPipe)
    jobSeekerId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    if (jobSeekerId !== req.user.sub) {
      throw new ForbiddenException('You can only view your own applications.');
    }
    return this.applicationsService.findByJobSeeker(req.user.sub);
  }

   @Get('documents/:documentId/download')
  @Roles('job_seeker', 'employer')
  @ApiOperation({
    summary: 'Download an application document if you are its applicant or the job owner',
  })
  async downloadDocument(
    @Param('documentId', ParseIntPipe)
    documentId: number,

    @Req() req: AuthenticatedRequest,

    @Res() res: Response,
  ) {
    const document =
      await this.applicationsService.getDocumentForUser(
        documentId,
        req.user.sub,
        req.user.role,
      );

    return res.download(
      document.filePath,
      document.originalName,
    );
  }


  @Get(':id')
  @Roles('job_seeker')
  @ApiOperation({
    summary: 'View one of your submitted applications',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.findOne(id, req.user.sub);
  }

  @Patch(':id/status')
  @Roles('employer')
  @ApiOperation({
    summary: 'Employer updates the status of ana application for their job',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateApplicationStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.updateStatus(id, req.user.sub, updateDto);
  }

  @Patch(':id')
  @Roles('job_seeker')
  @ApiOperation({
    summary: 'Update your cover letter before employer review',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.update(
      id,
      req.user.sub,
      updateApplicationDto,
    );
  }

  @Delete(':id')
  @Roles('job_seeker')
  @ApiOperation({
    summary: 'Withdraw an application that has not yet been reviewed',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.remove(id, req.user.sub);
  }

  @Get('documents/:documentId/download')
  @Roles('job_seeker', 'employer')
  @ApiOperation({
    summary:
      'Download an application document if you are its applicant or the job owner',
  })
  async downloadDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const document = await this.applicationsService.getDocumentForUser(
      documentId,
      req.user.sub,
      req.user.role,
    );
    return res.download(document.filePath, document.originalName);
  }
}
