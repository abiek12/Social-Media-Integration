import express from "express";
import { verifyWhatsappWebhook, whatsAppBroadcast, whatsAppWebhook } from "../services/whatsapp.service";
import { authUtility } from "../../utils/authUtility";

const router = express.Router();
const _authUtility = new authUtility();

// Whatsapp user config routes
router.get("/config", _authUtility.verifyToken, _authUtility.isSubscriber, whatsAppWebhook);
router.post("/config", _authUtility.verifyToken, _authUtility.isSubscriber, whatsAppWebhook);
router.patch("/config", _authUtility.verifyToken, _authUtility.isSubscriber, whatsAppWebhook);

// Whatsapp webhook routes
router.get("/webhook", verifyWhatsappWebhook);
router.post("/webhook", whatsAppWebhook);

// Broadcast message
router.post("/", _authUtility.verifyToken, _authUtility.isSubscriber, whatsAppBroadcast);

export default router;