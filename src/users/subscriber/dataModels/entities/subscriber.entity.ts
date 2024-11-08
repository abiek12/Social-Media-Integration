import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
import { userRoles } from "../enums/userRoles.enums";
import { kycVerification } from "../enums/subscriber.enums";
  
  @Entity("subscribers")
  export class subscribers {
    @PrimaryGeneratedColumn({name: 'subscriber_id'})
    subscriberId: number;
      
    @Column({ name: 'company_email', type: "varchar", length: 255, nullable: false })
    email: string;

    @Column({ name: 'password', type: "varchar", length: 255, nullable: false })
    password: string;
  
    @Column({ name: 'user_name', type: "varchar", length: 255, nullable: false })
    userName: string;

    @Column({ name: 'company_name', type: "varchar", length: 255, nullable: false })
    company: string;

    @Column({ name: 'user_role', type: "enum", nullable: false, enum: userRoles })
    userRole: string;
  
    @Column({ name: 'company_contact_number', type: "varchar", length: 255, nullable: true })
    contactNumber: string;
  
    @Column({ type: "varchar", length: 255, nullable: true, name: "country" })
    country?: string;
    
    @Column({ type: "varchar", length: 255, nullable: true, name: "state" })
    state?: string;
  
    @Column({ type: "varchar", length: 255, nullable: true, name: "city" })
    city?: string;
  
    @Column({ type: "varchar", length: 255, nullable: true, name: "pincode" })
    pincode?: string;
  
    @Column({ name: 'address', type: "varchar", length: 255, nullable: true })
    address: string;
  
  }
  