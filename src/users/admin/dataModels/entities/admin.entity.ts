import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity("admins")
  export class admins {
    @PrimaryGeneratedColumn()
    user_id: number;
  
    @Column({ type: "varchar", length: 255 })
    userName: string;
  
    @Column({ type: "varchar", length: 255 })
    password: string;
  
    @Column({ type: "varchar", length: 255, nullable: false })
    email: string;
  
    @Column({
      nullable: false,
    })
    userRole: string;
  
    @Column({ type: "boolean", default: false })
    blocked: boolean;
  
    @Column({ name: "email_varified", type: "boolean", default: false })
    emailVarified: boolean;
  
    @CreateDateColumn()
    createdOn: Date;
  
    @UpdateDateColumn()
    updatedOn: Date;
  
    @Column({ type: "timestamp", nullable: true })
    lastLogin: Date;
  
    @Column({ type: "varchar", length: 255, nullable: true })
    activationKey: string;
  
    @Column({ type: "timestamp", nullable: true })
    activationKeyExpiryDate: Date;
  
    @Column({ type: "boolean", nullable: true })
    lockOut: boolean;
  
    @Column({ type: "timestamp", nullable: true })
    lockOutEnd?: Date;
  
    @Column({ type: "int", default: 0 })
    failedCount: number;
  
    @Column({ type: "varchar", length: 255, nullable: true })
    resetPasswordKey: string;
  
    @Column({ type: "timestamp", nullable: true })
    resetPasswordExpiryDate: Date;
  
    @Column({ type: "varchar", length: 255, nullable: true })
    twoFACode: string;
  
    @Column({ type: "timestamp", nullable: true })
    twoFAExpiry: Date;
  
    @Column({ type: "json", nullable: true })
    userSettings: any;
  
    @Column({ type: "varchar", length: 255, nullable: true })
    socialProvider: string;
  
    @Column({ type: "varchar", length: 255, nullable: true })
    userSocialId: string;
  
    @Column({ type: "boolean", default: false })
    approved: boolean;
  
    @Column({ type: "text", nullable: true })
    comments: string;
  }
  