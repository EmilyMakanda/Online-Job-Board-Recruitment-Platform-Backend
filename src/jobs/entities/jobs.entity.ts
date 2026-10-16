import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Application } from '../../applications/entities/application.entity.js';

export enum JobStatus {
    OPEN = 'OPEN',
    CLOSED ='CLOSED',
    DRAFT = 'DRAFT',
}

@Entity('jobs')
export class Job{
    // Fields for the Job entity

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 150, nullable: false})
    title: string;

    @Column({type: 'varchar', length: 2000, nullable: false})
    description: string;

    @Column({type: 'varchar2', length: 100, nullable: false})
    location: string;

    @Column({type: 'varchar2', length: 20, default: JobStatus.OPEN,})
    status: JobStatus;

    @ManyToOne(() => User, (user) => user.jobs, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'posted_by_user_id'})
    postedBy: User;

    @OneToMany(() => Application, (application) => application.job)
    applications: Application[];

    @CreateDateColumn({type: 'timestamp'})
    createdAt: Date;
    
    @UpdateDateColumn({type: 'timestamp'})
    updatedAt: Date;
}