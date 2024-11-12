"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const authUtility_1 = require("../../utils/authUtility");
const passport_1 = __importDefault(require("passport"));
const socialMediaUtility_1 = require("../../utils/socialMediaUtility");
const _authUtility = new authUtility_1.authUtility();
// This route will initially calls from the frontend by click on the facebook login button, 
// passport.authenticate('facebook') is a middleware used to authenticate the user then it will call the facebook strategy
router.get('/facebook', _authUtility.verifyToken, _authUtility.isSubscriber, (req, res, next) => {
    passport_1.default.authenticate('facebook', {
        scope: [
            'public_profile',
            'pages_manage_posts',
            'pages_manage_metadata',
            'pages_read_engagement',
            'pages_manage_ads',
            'pages_show_list',
            'pages_read_engagement',
            'leads_retrieval',
            'ads_management',
            'pages_manage_metadata',
            'instagram_basic',
            'instagram_manage_insights',
            'instagram_manage_comments',
            'whatsapp_business_management',
            'whatsapp_business_messaging',
        ],
        state: req.user.userId // dynamically pass `state`
    })(req, res, next);
});
// Callback route for facebook to redirect to passport.authenticate('facebook')
// is a middleware which is used to exchange the code with user details then fire callback function
router.get('/facebook/callback', passport_1.default.authenticate('facebook', {
    successRedirect: socialMediaUtility_1.CLIENT_SUCCESS_URL,
    successMessage: "User authenticated facebook successfully",
    failureRedirect: socialMediaUtility_1.CLIENT_FAILED_URL,
    failureMessage: "User authentication failed!",
}));
exports.default = router;
