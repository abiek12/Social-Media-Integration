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
exports.subscriberSocialMedia = void 0;
const typeorm_1 = require("typeorm");
const subscriberFacebook_entity_1 = require("./subscriberFacebook.entity");
const subscriber_entity_1 = require("../../../users/subscriber/dataModels/entities/subscriber.entity");
let subscriberSocialMedia = class subscriberSocialMedia {
};
exports.subscriberSocialMedia = subscriberSocialMedia;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: "sub_social_media_id" }),
    __metadata("design:type", Number)
], subscriberSocialMedia.prototype, "subscriberSocialMediaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: false, name: "subscriber_id" }),
    (0, typeorm_1.ManyToOne)(() => subscriber_entity_1.subscribers),
    (0, typeorm_1.JoinColumn)({ name: "subscriber_id" }),
    __metadata("design:type", subscriber_entity_1.subscribers)
], subscriberSocialMedia.prototype, "subscriber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "facebook_id" }),
    (0, typeorm_1.ManyToOne)(() => subscriberFacebook_entity_1.SubscriberFacebookSettings),
    (0, typeorm_1.JoinColumn)({ name: "facebook_id" }),
    __metadata("design:type", subscriberFacebook_entity_1.SubscriberFacebookSettings)
], subscriberSocialMedia.prototype, "facebook", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], subscriberSocialMedia.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], subscriberSocialMedia.prototype, "updatedAt", void 0);
exports.subscriberSocialMedia = subscriberSocialMedia = __decorate([
    (0, typeorm_1.Entity)("sub_social_media")
], subscriberSocialMedia);
