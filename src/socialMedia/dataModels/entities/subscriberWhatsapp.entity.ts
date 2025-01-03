import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { subscriberSocialMedia } from "./subscriberSocialMedia.entity";
import { subscribers } from "../../../users/subscriber/dataModels/entities/subscriber.entity";

@Entity("sub_whatsapp_settings")
export class SubscriberWhatsappSettings {
    @PrimaryGeneratedColumn({ name: "sub_whatsapp_settings_id" })
    subWhatsappSettingsId: number;

    @PrimaryColumn({ type: "int", nullable: false, name: "subscriber_id" })
    @ManyToOne(() => subscribers)
    @JoinColumn({ name: "subscriber_id" })
    subscriber: subscribers;

    @Column({ type: "int",  name: "social_media_id" })
    @ManyToOne(() => subscriberSocialMedia)
    @JoinColumn({ name: "social_media_id" })
    subscriberSocialMedia: subscriberSocialMedia;

    @Column({ type: "varchar", length: 255, nullable: false, name: "phone_no_id" })
    phoneNoId: string;

    @Column({ type: "varchar", length: 255, nullable: false, name: "access_token" })
    accessToken: string;

    @Column({ type: "varchar", length: 255, nullable: true, name: "wa_id" })
    waId: string;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at"})
    updatedAt: Date;
}