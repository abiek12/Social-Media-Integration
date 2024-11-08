"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const meta_services_1 = require("../services/meta.services");
const authUtility_1 = require("../../utils/authUtility");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const _metaServices = new meta_services_1.metaServices();
const _authUtility = new authUtility_1.authUtility();
router.get('/webhook', _metaServices.verifyWebhook);
router.post('/webhook', _metaServices.handleWebhook);
// Fetch facebook pages of the user(subscriber) using meta graph api
router.get('/facebook/fetchPages', _authUtility.verifyToken, _authUtility.isSubscriber, _metaServices.fetchPages);
router.post('facebook/selectPage', _metaServices.choosePages);
exports.default = router;
