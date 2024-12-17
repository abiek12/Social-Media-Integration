import express from "express";
import { verifyWhatsappWebhook, whatsAppBroadcast, whatsAppWebhook } from "../services/whatsapp.service";

const router = express.Router();

router.get("/webhook", verifyWhatsappWebhook);
router.post("/webhook", whatsAppWebhook);
router.get("/", whatsAppBroadcast);

// post route for whatsapp config

export default router;