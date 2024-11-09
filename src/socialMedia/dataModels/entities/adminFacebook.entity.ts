import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("admin_facebook_settings")
export class AdminFacebookSettings {
    @PrimaryGeneratedColumn({ name: "admin_fb_settings_id" })
    adminFacebookSettingsId: number;

    @Column({ type: "varchar", length: 255, nullable: false, name: "app_access_token" })
    appAccessToken: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
