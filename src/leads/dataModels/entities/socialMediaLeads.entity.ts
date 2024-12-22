import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { leadSource, leadStatus } from '../enums/lead.enums';
import { subscribers } from '../../../users/subscriber/dataModels/entities/subscriber.entity';

@Entity({ name: 'social_media_leads' })
export class SocialMediaLeads {
  @PrimaryGeneratedColumn({ name: 'social_media_lead_id' })
  leadId: number;

  @PrimaryColumn({ type: "int", nullable: false, name: "subscriber_id" })
  @ManyToOne(() => subscribers)
  @JoinColumn({ name: "subscriber_id" })
  subscriber: subscribers;

  @Column({ name: 'lead_text' })
  leadText: string;

  @Column({ name: 'status', type: "enum", enum: leadStatus })
  status: string;

  @Column({ name:"source", type: "enum", enum: leadSource })
  source: string;

  @Column({ name: 'contact_phone' })
  contactPhone: string;

  @Column({ name: 'contact_name'})
  contactName: string;

  @Column({ name: 'contact_email'})
  contactEmail: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ type: "boolean", default: false, name: "is_deleted" })
  isDeleted: boolean; 
}