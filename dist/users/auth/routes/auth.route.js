"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const auth_service_1 = require("../services/auth.service");
const _authService = new auth_service_1.AuthService();
router.post('/', _authService.userLogin);
exports.default = router;
