import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('employers')
export class Employer{
    @PrimaryGeneratedColumn({name: 'employer_id', })
    id: number;

    @Column({name:'full_name', length: 100 })
    fullName:string;

    @Column({length: 150, unique: true})
    email:string;

    @Column({name:'password_hash', length: 255})
    passwordHash:string;

    @Column({length:20, nullable:true})
    phone:string;

    @Column({length: 20})
    role:string;

}