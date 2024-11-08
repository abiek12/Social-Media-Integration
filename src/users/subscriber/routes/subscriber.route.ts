import { Application } from "express";
import express from "express";
const router = express.Router();
import { subscriberService } from "../services/subscriber.service";

const subscriberRoutes = async (app: Application) => {
    const _subscriberService = new subscriberService();
    router.post('/register',_subscriberService.subscriberRegistration);
}

export default subscriberRoutes;