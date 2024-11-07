import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { leadStatus } from '../enums/lead.enums';
import { subscribers } from '../../../users/subscriber/dataModels/entities/subscriber.entity';

@Entity({ name: 'subscriber_leads' })
export class subscriberLeads {
  @PrimaryGeneratedColumn({ name: 'lead_id' })
  leadId: number;

  @Column({ name: 'lead_text' })
  leadText: string;

  @Column({ name: 'designation' })
  designation: string;

  @Column({ name: 'status', type: "enum", enum: leadStatus })
  status: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'remarks' })
  remarks: string;

  @Column({  type: 'float', name: 'price'})
  price: number;

  @Column({  type: 'float', name: 'discounted_price'})
  discountedPrice: number;

  @Column({ name: 'follow_up', type: "date" })
  followUp: Date;

  @Column({ name: 'previous_follow_up', type: "date" })
  previousFollowUp: Date;

  @Column({ name: 'client_name'})
  clientName: string;

  @Column({ name: 'contact_phone' })
  contactPhone: string;

  @Column({ name: 'gst' })
  gst: string;

  @Column({ name: 'contact_name'})
  contactName: string;

  @Column({ name: 'contact_email'})
  contactEmail: string;

  @Column({ name: 'contact_country'})
  contactCountry: string;

  @Column({ name: 'contact_state'})
  contactState: string;

  @Column({ name: 'contact_city'})
  contactCity: string;

  @Column({ name: 'contact_pincode'})
  contactPincode: string;

  @Column({ name: 'contact_address', type: "varchar", length: 255})
  contactAddress: string;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: "boolean", default: false, name: "is_deleted" })
  isDeleted: boolean;

  @Column({ type: "int", nullable: false, name: "subscriber_id" })
  @ManyToOne(() => subscribers)
  @JoinColumn({ name: "subscriber_id" })
  subscriberId: number; 
}