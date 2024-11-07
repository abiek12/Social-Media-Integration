import { metaServices } from "../services/meta.services";
import { authUtility } from "../../utils/authUtility";
import { Application } from "express";

const metaRoutes = async (app: Application) => {
    const metaRoutes = new metaServices();
    const _authUtility = new authUtility();

    app.get('/facebook', metaRoutes.verifyWebhook);
    app.post('/facebook', metaRoutes.handleWebhook);

    // Fetch facebook pages of the user(subscriber) using meta graph api
    app.get('/facebook/fetchPages', _authUtility.verifyToken, _authUtility.isSubscriber, metaRoutes.fetchPages);
    app.post('facebook/selectPage', metaRoutes.choosePages);

}

export default metaRoutes;