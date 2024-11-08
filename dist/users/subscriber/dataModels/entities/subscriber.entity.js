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
exports.subscribers = void 0;
const typeorm_1 = require("typeorm");
const userRoles_enums_1 = require("../enums/userRoles.enums");
const subscriber_enums_1 = require("../enums/subscriber.enums");
let subscribers = class subscribers {
};
exports.subscribers = subscribers;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'subscriber_id' }),
    __metadata("design:type", Number)
], subscribers.prototype, "subscriberId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_email', type: "varchar", length: 255, nullable: false }),
    __metadata("design:type", String)
], subscribers.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password', type: "varchar", length: 255, nullable: false }),
    __metadata("design:type", String)
], subscribers.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_name', type: "varchar", length: 255, nullable: false }),
    __metadata("design:type", String)
], subscribers.prototype, "userName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_name', type: "varchar", length: 255, nullable: false }),
    __metadata("design:type", String)
], subscribers.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_role', type: "enum", nullable: false, enum: userRoles_enums_1.userRoles }),
    __metadata("design:type", String)
], subscribers.prototype, "userRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_contact_number', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "contactNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true, name: "country" }),
    __metadata("design:type", String)
], subscribers.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true, name: "state" }),
    __metadata("design:type", String)
], subscribers.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true, name: "city" }),
    __metadata("design:type", String)
], subscribers.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true, name: "pincode" }),
    __metadata("design:type", String)
], subscribers.prototype, "pincode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'roc', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "roc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_proof', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "addressProof", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gst', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "gst", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gst_number', type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "gstNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_paid', type: "boolean", default: false, nullable: false }),
    __metadata("design:type", Boolean)
], subscribers.prototype, "isPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_plan_expired', type: "boolean", default: false, nullable: false }),
    __metadata("design:type", Boolean)
], subscribers.prototype, "isPlanExpired", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cdr_auto_convert', type: "boolean", default: false, nullable: false }),
    __metadata("design:type", Boolean)
], subscribers.prototype, "cdrAutoConvert", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_deleted', type: "boolean", default: false, nullable: false }),
    __metadata("design:type", Boolean)
], subscribers.prototype, "isDeleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'blocked', type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], subscribers.prototype, "blocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email_varified', type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], subscribers.prototype, "emailVarified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone_verified', type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], subscribers.prototype, "phoneVerified", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], subscribers.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], subscribers.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_login', type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], subscribers.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activation_key', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "activationKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activation_key_expiry', type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], subscribers.prototype, "activationKeyExpiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lock_out', type: "boolean", nullable: true }),
    __metadata("design:type", Boolean)
], subscribers.prototype, "lockOut", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lockoutend', type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], subscribers.prototype, "lockOutEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'failed_count', type: "int", default: 0 }),
    __metadata("design:type", Number)
], subscribers.prototype, "failedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reset_password_key', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "resetPasswordKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reset_password_expiry', type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], subscribers.prototype, "resetPasswordExpiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'two_fa_code', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "twoFACode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'two_fa_expiry', type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], subscribers.prototype, "twoFAExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_settings', type: "json", nullable: true }),
    __metadata("design:type", Object)
], subscribers.prototype, "userSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'social_provider', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "socialProvider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_social_id', type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "userSocialId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved', type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], subscribers.prototype, "approved", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments', type: "text", nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reason_for_rejection', type: "text", nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "reasonForRejection", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kyc_verified', type: "enum", nullable: false, enum: subscriber_enums_1.kycVerification }),
    __metadata("design:type", String)
], subscribers.prototype, "kycVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency', type: "varchar", length: 3, default: "INR" }),
    __metadata("design:type", String)
], subscribers.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email_otp', type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], subscribers.prototype, "emailOtp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email_otp_expiry', type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], subscribers.prototype, "emailOtpExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone_otp', type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], subscribers.prototype, "phoneOtp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone_otp_expiry', type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], subscribers.prototype, "phoneOtpExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'prefix', type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", String)
], subscribers.prototype, "prefix", void 0);
exports.subscribers = subscribers = __decorate([
    (0, typeorm_1.Entity)("subscribers")
], subscribers);
