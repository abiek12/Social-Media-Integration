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
exports.SubscriberFacebookSettings = void 0;
const typeorm_1 = require("typeorm");
let SubscriberFacebookSettings = class SubscriberFacebookSettings {
};
exports.SubscriberFacebookSettings = SubscriberFacebookSettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: "sub_fb_settings_id" }),
    __metadata("design:type", Number)
], SubscriberFacebookSettings.prototype, "subFacebookSettingsId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true, name: "page_id" }),
    __metadata("design:type", String)
], SubscriberFacebookSettings.prototype, "pageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true, name: "page_name" }),
    __metadata("design:type", String)
], SubscriberFacebookSettings.prototype, "pageName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true, name: "page_access_token" }),
    __metadata("design:type", String)
], SubscriberFacebookSettings.prototype, "pageAccessToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true, name: "profle_id" }),
    __metadata("design:type", String)
], SubscriberFacebookSettings.prototype, "profileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true, name: "user_access_token" }),
    __metadata("design:type", String)
], SubscriberFacebookSettings.prototype, "userAccessToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true, name: "user_token_expires_at" }),
    __metadata("design:type", Date)
], SubscriberFacebookSettings.prototype, "userTokenExpiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true, name: "page_token_expires_at" }),
    __metadata("design:type", Date)
], SubscriberFacebookSettings.prototype, "pageTokenExpiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], SubscriberFacebookSettings.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], SubscriberFacebookSettings.prototype, "updatedAt", void 0);
exports.SubscriberFacebookSettings = SubscriberFacebookSettings = __decorate([
    (0, typeorm_1.Entity)("sub_facebook_settings")
], SubscriberFacebookSettings);
