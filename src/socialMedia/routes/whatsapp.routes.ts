import express from "express";
import { createWhatsappConfig, getWhatsappConfig, updateWhatsappConfig, verifyWhatsappWebhook, whatsAppBroadcast, whatsAppWebhook } from "../services/whatsapp.service";
import { authUtility } from "../../utils/authUtility";
import { create } from "domain";

const router = express.Router();
const _authUtility = new authUtility();

// Whatsapp user config routes
router.get("/config", _authUtility.verifyToken, _authUtility.isSubscriber, getWhatsappConfig);
router.post("/config", _authUtility.verifyToken, _authUtility.isSubscriber, createWhatsappConfig);
router.patch("/config", _authUtility.verifyToken, _authUtility.isSubscriber, updateWhatsappConfig);
router.delete("/config", _authUtility.verifyToken, _authUtility.isSubscriber, updateWhatsappConfig);

// Whatsapp webhook routes
router.get("/webhook", verifyWhatsappWebhook);
router.post("/webhook", whatsAppWebhook);

// Broadcast message
router.post("/", _authUtility.verifyToken, _authUtility.isSubscriber, whatsAppBroadcast);

export default router;