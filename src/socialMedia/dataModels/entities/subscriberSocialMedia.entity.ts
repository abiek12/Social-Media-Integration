import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SubscriberFacebookSettings } from "./subscriberFacebook.entity";
import { subscribers } from "../../../users/subscriber/dataModels/entities/subscriber.entity";

@Entity("sub_social_media")
export class subscriberSocialMedia {
    @PrimaryGeneratedColumn({ name: "sub_social_media_id" })
    subscriberSocialMediaId: number;

    @Column({ type: "int", nullable: false, name: "subscriber_id" })
    @ManyToOne(() => subscribers)
    @JoinColumn({ name: "subscriber_id" })
    subscriber: subscribers;

    @Column({ type: "int", name: "facebook_id" })
    @ManyToOne(() => SubscriberFacebookSettings)
    @JoinColumn({ name: "facebook_id" })
    facebook: SubscriberFacebookSettings;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at"})
    updatedAt: Date;
}