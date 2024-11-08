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
exports.subscribers = subscribers = __decorate([
    (0, typeorm_1.Entity)("subscribers")
], subscribers);
