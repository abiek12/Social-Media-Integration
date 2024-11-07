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
  
    @Column({ name: 'user_name', type: "varchar", length: 255, nullable: false })
    userName: string;
  
    @Column({ name: 'company_name', type: "varchar", length: 255, nullable: false })
    company: string;
  
    @Column({ name: 'company_email', type: "varchar", length: 255, nullable: false })
    email: string;
  
    @Column({ name: 'company_contact_number', type: "varchar", length: 255, nullable: false })
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
  
    @Column({ name: 'password', type: "varchar", length: 255, nullable: false })
    password: string;
  
    @Column({ name: 'roc', type: "varchar", length: 255, nullable: true })
    roc: string;
  
    @Column({ name: 'address_proof', type: "varchar", length: 255, nullable: true })
    addressProof: string;
  
    @Column({ name: 'gst', type: "varchar", length: 255, nullable: true })
    gst: string;
  
    @Column({ name: 'gst_number', type: "varchar", length: 50, nullable: true })
    gstNumber: string;
  
    @Column({ name: 'logo', type: "varchar", length: 255, nullable: true })
    logo: string;
  
    @Column({ name: 'user_role', type: "enum", nullable: false, enum: userRoles })
    userRole: string;
  
    @Column({ name: 'is_paid', type: "boolean", default: false, nullable: false })
    isPaid: boolean;
  
    @Column({ name: 'is_plan_expired', type: "boolean", default: false, nullable: false })
    isPlanExpired: boolean;
  
    @Column({ name: 'cdr_auto_convert', type: "boolean", default: false, nullable: false })
    cdrAutoConvert: boolean;
  
    @Column({ name: 'is_deleted', type: "boolean",default: false, nullable: false })
    isDeleted: boolean;
  
    @Column({ name: 'blocked', type: "boolean", default: false })
    blocked: boolean;
  
    @Column({ name: 'email_varified', type: "boolean", default: false })
    emailVarified: boolean;
  
    @Column({ name: 'phone_verified', type: "boolean", default: false })
    phoneVerified: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @Column({ name: 'last_login', type: "timestamp", nullable: true })
    lastLogin: Date;
  
    @Column({ name: 'activation_key', type: "varchar", length: 255, nullable: true })
    activationKey?: string;
  
    @Column({ name: 'activation_key_expiry', type: "timestamp", nullable: true })
    activationKeyExpiryDate?: Date;
  
    @Column({ name:'lock_out',type: "boolean", nullable: true })
    lockOut: boolean;
  
    @Column({name:'lockoutend', type: "timestamp", nullable: true })
    lockOutEnd?: Date;
  
    @Column({name:'failed_count', type: "int", default: 0 })
    failedCount: number;
  
    @Column({ name:'reset_password_key',type: "varchar", length: 255, nullable: true })
    resetPasswordKey: string;
  
    @Column({ name:'reset_password_expiry', type: "timestamp", nullable: true })
    resetPasswordExpiryDate: Date;
  
    @Column({ name: 'two_fa_code', type: "varchar", length: 255, nullable: true })
    twoFACode: string;
  
    @Column({ name: 'two_fa_expiry', type: "timestamp", nullable: true })
    twoFAExpiry: Date;
  
    @Column({ name: 'user_settings', type: "json", nullable: true })
    userSettings: any;
  
    @Column({ name: 'social_provider', type: "varchar", length: 255, nullable: true })
    socialProvider: string;
  
    @Column({ name: 'user_social_id', type: "varchar", length: 255, nullable: true })
    userSocialId: string;
  
    @Column({name: 'approved', type: "boolean", default: false })
    approved: boolean;
  
    @Column({name: 'comments', type: "text", nullable: true })
    comments: string;
  
    @Column({name: 'reason_for_rejection', type: "text", nullable: true })
    reasonForRejection: string;
  
    @Column({name: 'kyc_verified', type: "enum", nullable: false, enum:kycVerification })
    kycVerified: string;
  
    @Column({name: 'currency', type: "varchar", length: 3, default: "INR"  })
    currency:string;
  
    @Column({name: 'email_otp', type: "varchar", length: 10, nullable: true })
    emailOtp?: string | null;
  
    @Column({ name: 'email_otp_expiry', type: "timestamp", nullable: true })
    emailOtpExpiry?: Date | null;
  
    @Column({name: 'phone_otp', type: "varchar", length: 10, nullable: true })
    phoneOtp?: string | null;
  
    @Column({ name: 'phone_otp_expiry', type: "timestamp", nullable: true })
    phoneOtpExpiry?: Date | null;
  
    @Column({name: 'prefix', type: "varchar", length: 20, nullable: true })
    prefix: string;
  
  }
  