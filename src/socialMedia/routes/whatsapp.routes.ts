import express from "express";
import { verifyWhatsappWebhook, whatsAppBroadcast, whatsAppWebhook } from "../services/whatsapp.service";

const router = express.Router();

router.get("/webhook", verifyWhatsappWebhook);
router.post("/webhook", whatsAppWebhook);
router.get("/", whatsAppBroadcast);

export default router;