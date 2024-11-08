import { Application } from "express";
import { authUtility } from "../../../utils/authUtility";
import { subscriberService } from "../services/subscriber.service";

const subscriberRoutes = async (app: Application) => {
    const _authUtility = new authUtility();
    const _subscriberService = new subscriberService();

    app.post('/subscriber/register',_subscriberService.subscriberRegistration);
}

export default subscriberRoutes;