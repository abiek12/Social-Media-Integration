import express from "express";
const router = express.Router();
import { subscriberService } from "../services/subscriber.service";

const _subscriberService = new subscriberService();
router.post('/register',_subscriberService.subscriberRegistration as any);

export default router;