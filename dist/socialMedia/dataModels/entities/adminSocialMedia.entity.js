"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSocialMedia = void 0;
const typeorm_1 = require("typeorm");
const adminFacebook_entity_1 = require("./adminFacebook.entity");
const admin_entity_1 = require("../../../users/admin/dataModels/entities/admin.entity");
let adminSocialMedia = class adminSocialMedia {
};
exports.adminSocialMedia = adminSocialMedia;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: "admin_social_media_id" }),
    __metadata("design:type", Number)
], adminSocialMedia.prototype, "adminSocialMediaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: false, name: "admin_id" }),
    (0, typeorm_1.ManyToOne)(() => admin_entity_1.admins),
    (0, typeorm_1.JoinColumn)({ name: "admin_id" }),
    __metadata("design:type", admin_entity_1.admins)
], adminSocialMedia.prototype, "admin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "facebook_id" }),
    (0, typeorm_1.ManyToOne)(() => adminFacebook_entity_1.AdminFacebookSettings),
    (0, typeorm_1.JoinColumn)({ name: "facebook_id" }),
    __metadata("design:type", adminFacebook_entity_1.AdminFacebookSettings)
], adminSocialMedia.prototype, "facebook", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", name: "is_webhook_subscribed", nullable: false, default: false }),
    __metadata("design:type", Boolean)
], adminSocialMedia.prototype, "isWebhookSubscribed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], adminSocialMedia.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], adminSocialMedia.prototype, "updatedAt", void 0);
exports.adminSocialMedia = adminSocialMedia = __decorate([
    (0, typeorm_1.Entity)("admin_social_media")
], adminSocialMedia);
