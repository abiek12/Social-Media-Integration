import express from "express";
import { whatsAppBroadcast, whatsAppWebhook } from "../services/whatsapp.service";

const router = express.Router();

router.get("/webhook", whatsAppWebhook);
router.post("/webhook", whatsAppWebhook);
router.get("/", whatsAppBroadcast);

export default router;