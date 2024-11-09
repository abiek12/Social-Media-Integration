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
exports.AdminFacebookSettings = void 0;
const typeorm_1 = require("typeorm");
let AdminFacebookSettings = class AdminFacebookSettings {
};
exports.AdminFacebookSettings = AdminFacebookSettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: "admin_fb_settings_id" }),
    __metadata("design:type", Number)
], AdminFacebookSettings.prototype, "adminFacebookSettingsId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: false, name: "app_access_token" }),
    __metadata("design:type", String)
], AdminFacebookSettings.prototype, "appAccessToken", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], AdminFacebookSettings.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], AdminFacebookSettings.prototype, "updatedAt", void 0);
exports.AdminFacebookSettings = AdminFacebookSettings = __decorate([
    (0, typeorm_1.Entity)("admin_facebook_settings")
], AdminFacebookSettings);
