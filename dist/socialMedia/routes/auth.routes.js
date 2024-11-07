"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const socialMediaAuth_service_1 = require("../services/socialMediaAuth.service");
const facebookAuthRoutes = (app) => __awaiter(void 0, void 0, void 0, function* () {
    /* This route will initially calls from the frontend by click on the facebook login button,
    passport.authenticate('facebook') is a middleware used to authenticate the user then it will call the facebook strategy */
    app.get('/facebook', socialMediaAuth_service_1.facebookAuthHandler);
    /* Callback route for facebook to redirect to passport.authenticate('facebook')
    is a middleware which is used to exchange the code with user details then fire callback function */
    app.get('/facebook/callback', socialMediaAuth_service_1.facebookCallbackHandler);
});
exports.default = facebookAuthRoutes;
