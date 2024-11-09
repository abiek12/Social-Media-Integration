import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AdminFacebookSettings } from "./adminFacebook.entity";
import { admins } from "../../../users/admin/dataModels/entities/admin.entity";

@Entity("admin_social_media")
export class adminSocialMedia {
    @PrimaryGeneratedColumn({ name: "admin_social_media_id" })
    adminSocialMediaId: number;

    @Column({ type: "int", nullable: false, name: "admin_id" })
    @ManyToOne(() => admins)
    @JoinColumn({ name: "admin_id" })
    admin: admins;

    @Column({ type: "int", name: "facebook_id" })
    @ManyToOne(() => AdminFacebookSettings)
    @JoinColumn({ name: "facebook_id" })
    facebook: AdminFacebookSettings;

    @Column({ type: "boolean", name: "is_webhook_subscribed", nullable: false, default: false })
    isWebhookSubscribed: boolean;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at"})
    updatedAt: Date;
}