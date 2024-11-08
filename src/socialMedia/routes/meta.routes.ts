import { metaServices } from "../services/meta.services";
import { authUtility } from "../../utils/authUtility";
import { Application } from "express";
import express from "express";
const router = express.Router();

const metaRoutes = async (app: Application) => {
    const metaRoutes = new metaServices();
    const _authUtility = new authUtility();

    router.get('/facebook', metaRoutes.verifyWebhook);
    router.post('/webhook/facebook', metaRoutes.handleWebhook);

    // Fetch facebook pages of the user(subscriber) using meta graph api
    router.get('/facebook/fetchPages', _authUtility.verifyToken, _authUtility.isSubscriber, metaRoutes.fetchPages);
    router.post('facebook/selectPage', metaRoutes.choosePages);

}

export default metaRoutes;