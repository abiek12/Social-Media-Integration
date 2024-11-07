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
const meta_services_1 = require("../services/meta.services");
const authUtility_1 = require("../../utils/authUtility");
const metaRoutes = (app) => __awaiter(void 0, void 0, void 0, function* () {
    const metaRoutes = new meta_services_1.metaServices();
    const _authUtility = new authUtility_1.authUtility();
    app.get('/facebook', metaRoutes.verifyWebhook);
    app.post('/webhook/facebook', metaRoutes.handleWebhook);
    // Fetch facebook pages of the user(subscriber) using meta graph api
    app.get('/facebook/fetchPages', _authUtility.verifyToken, _authUtility.isSubscriber, metaRoutes.fetchPages);
    app.post('facebook/selectPage', metaRoutes.choosePages);
});
exports.default = metaRoutes;
