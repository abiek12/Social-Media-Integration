"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const subscriber_service_1 = require("../services/subscriber.service");
const _subscriberService = new subscriber_service_1.subscriberService();
router.post('/register', _subscriberService.subscriberRegistration);
exports.default = router;
