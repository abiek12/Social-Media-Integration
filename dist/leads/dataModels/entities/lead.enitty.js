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
exports.subscriberLeads = void 0;
const typeorm_1 = require("typeorm");
const lead_enums_1 = require("../enums/lead.enums");
const subscriber_entity_1 = require("../../../users/subscriber/dataModels/entities/subscriber.entity");
let subscriberLeads = class subscriberLeads {
};
exports.subscriberLeads = subscriberLeads;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'lead_id' }),
    __metadata("design:type", Number)
], subscriberLeads.prototype, "leadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lead_text' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "leadText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'designation' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "designation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: "enum", enum: lead_enums_1.leadStatus }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'remarks' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'price' }),
    __metadata("design:type", Number)
], subscriberLeads.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'discounted_price' }),
    __metadata("design:type", Number)
], subscriberLeads.prototype, "discountedPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follow_up', type: "date" }),
    __metadata("design:type", Date)
], subscriberLeads.prototype, "followUp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'previous_follow_up', type: "date" }),
    __metadata("design:type", Date)
], subscriberLeads.prototype, "previousFollowUp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_name' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_phone' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "contactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gst' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "gst", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_name' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "contactName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_email' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_country' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "contactCountry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_state' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "contactState", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_city' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "contactCity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_pincode' }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "contactPincode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_address', type: "varchar", length: 255 }),
    __metadata("design:type", String)
], subscriberLeads.prototype, "contactAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at' }),
    __metadata("design:type", Date)
], subscriberLeads.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], subscriberLeads.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false, name: "is_deleted" }),
    __metadata("design:type", Boolean)
], subscriberLeads.prototype, "isDeleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: false, name: "subscriber_id" }),
    (0, typeorm_1.ManyToOne)(() => subscriber_entity_1.subscribers),
    (0, typeorm_1.JoinColumn)({ name: "subscriber_id" }),
    __metadata("design:type", Number)
], subscriberLeads.prototype, "subscriberId", void 0);
exports.subscriberLeads = subscriberLeads = __decorate([
    (0, typeorm_1.Entity)({ name: 'subscriber_leads' })
], subscriberLeads);
