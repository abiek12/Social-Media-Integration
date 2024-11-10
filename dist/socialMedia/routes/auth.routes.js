"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const socialMediaAuth_service_1 = require("../services/socialMediaAuth.service");
const authUtility_1 = require("../../utils/authUtility");
const _authUtility = new authUtility_1.authUtility();
/* This route will initially calls from the frontend by click on the facebook login button,
passport.authenticate('facebook') is a middleware used to authenticate the user then it will call the facebook strategy */
router.get('/facebook', _authUtility.verifyToken, _authUtility.isSubscriber, socialMediaAuth_service_1.facebookAuthHandler);
/* Callback route for facebook to redirect to passport.authenticate('facebook')
is a middleware which is used to exchange the code with user details then fire callback function */
router.get('/facebook/callback', socialMediaAuth_service_1.facebookCallbackHandler);
exports.default = router;
