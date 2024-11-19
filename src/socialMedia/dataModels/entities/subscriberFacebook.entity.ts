import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { subscriberSocialMedia } from "./subscriberSocialMedia.entity";

@Entity("sub_facebook_settings")
export class SubscriberFacebookSettings {
    @PrimaryGeneratedColumn({ name: "sub_fb_settings_id" })
    subFacebookSettingsId: number;

    @Column({ type: "int", name: "social_media_id" })
    @ManyToOne(() => subscriberSocialMedia)
    @JoinColumn({ name: "social_media_id" })
    facebook: subscriberSocialMedia;

    @Column({ type: "varchar", length: 255, nullable: true, name: "page_id" })
    pageId: string;

    @Column({ type: "varchar", length: 255, nullable: true, name: "page_name" })
    pageName: string;

    @Column({ type: "text", nullable: true, name: "page_access_token" })
    pageAccessToken: string;

    @Column({ type: "date", nullable: true, name: "page_token_expires_at" })
    pageTokenExpiresAt: Date;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at"})
    updatedAt: Date;
}