import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { subscribers } from "../../../users/subscriber/dataModels/entities/subscriber.entity";

@Entity("sub_social_media")
export class subscriberSocialMedia {
    @PrimaryGeneratedColumn({ name: "sub_social_media_id" })
    subscriberSocialMediaId: number;

    @PrimaryColumn({ type: "int", nullable: false, name: "subscriber_id" })
    @ManyToOne(() => subscribers)
    @JoinColumn({ name: "subscriber_id" })
    subscriber: subscribers;

    @Column({ type: "text", nullable: false, name: "social_media_name" })
    socialMedia: string;

    @Column({ type: "varchar", length: 255, nullable: true, name: "profle_id" })
    profileId: string;

    @Column({ type: "text", nullable: true, name: "user_access_token" })
    userAccessToken: string;

    @Column({ type: "date", nullable: true, name: "user_token_expires_at" })
    userTokenExpiresAt: Date;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at"})
    updatedAt: Date;
}