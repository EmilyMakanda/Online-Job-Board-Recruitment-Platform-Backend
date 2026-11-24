import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { Application } from './application.entity.js';

export enum ApplicationDocumentType {
  CV = 'CV',
  COVER_LETTER = 'COVER_LETTER',
  SUPPORTING = 'SUPPORTING',
}

@Entity('APPLICATION_DOCUMENTS')
export class ApplicationDocument {
  @PrimaryGeneratedColumn({ name: 'DOCUMENT_ID', type: 'number' })
  documentId: number;

  @Column({ name: 'APPLICATION_ID', type: 'number' })
  applicationId: number;

  @Column({ name: 'DOCUMENT_TYPE', type: 'varchar2', length: 50 })
  documentType: ApplicationDocumentType;

  @Column({ name: 'ORIGINAL_NAME', type: 'varchar2', length: 255 })
  originalName: string;

  @Column({ name: 'STORED_NAME', type: 'varchar2', length: 255, unique: true })
  storedName: string;

  @Column({ name: 'MIME_TYPE', type: 'varchar2', length: 100 })
  mimeType: string;

  @Column({ name: 'FILE_SIZE', type: 'number' })
  fileSize: number;

  @Column({ name: 'FILE_PATH', type: 'varchar2', length: 1000 })
  filePath: string;

  @CreateDateColumn({ name: 'UPLOADED_AT', type: 'timestamp' })
  uploadedAt: Date;

  @ManyToOne(() => Application, (application) => application.documents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'APPLICATION_ID', referencedColumnName: 'applicationId' })
  application: Relation<Application>;
}