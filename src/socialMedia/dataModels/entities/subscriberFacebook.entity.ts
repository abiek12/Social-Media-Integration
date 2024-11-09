import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { subscribers } from "../../../users/subscriber/dataModels/entities/subscriber.entity";

@Entity("sub_facebook_settings")
export class SubscriberFacebookSettings {
    @PrimaryGeneratedColumn({ name: "sub_fb_settings_id" })
    subFacebookSettingsId: number;

    @Column({ type: "varchar", length: 255, nullable: true, name: "page_id" })
    pageId: string;

    @Column({ type: "varchar", length: 255, nullable: true, name: "page_name" })
    pageName: string;

    @Column({ type: "varchar", length: 255, nullable: true, name: "page_access_token" })
    pageAccessToken: string;

    @Column({ type: "varchar", length: 255, nullable: true, name: "profle_id" })
    profileId: string;

    @Column({ type: "varchar", length: 255, nullable: true, name: "user_access_token" })
    userAccessToken: string;

    @Column({ type: "date", nullable: true, name: "user_token_expires_at" })
    userTokenExpiresAt: Date;

    @Column({ type: "date", nullable: true, name: "page_token_expires_at" })
    pageTokenExpiresAt: Date;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at"})
    updatedAt: Date;

    @Column({ type: "int", nullable: false, name: "subscriber_id" })
    @ManyToOne(() => subscribers)
    @JoinColumn({ name: "subscriber_id" })
    subscriber: subscribers;
}