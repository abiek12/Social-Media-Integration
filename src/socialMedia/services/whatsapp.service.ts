import axios from "axios";
import { Request, Response } from "express";
import { checkSubscriberExitenceUsingId, ERROR_COMMON_MESSAGE, INTERNAL_ERROR, NOT_AUTHORIZED, NOT_FOUND, SUCCESS_GET } from "../../utils/common";
import { CustomError } from "../../utils/response";
import { getDataSource } from "../../utils/dataSource";
import { Leads } from "../../leads/dataModels/entities/lead.entity";
import { sendBulkWhatsappMessage } from "../../utils/socialMediaUtility";
import { SubscriberWhatsappSettings } from "../dataModels/entities/subscriberWhatsapp.entity";

export const verifyWhatsappWebhook = async (req: any, res: any) => {
    try {
        const WEBHOOK_VERIFY_TOKEN = "HAPPY";
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];
        // check the mode and token sent are correct
        if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
          // respond with 200 OK and challenge token from the request
          res.status(200).send(challenge);
          console.log("Webhook verified successfully!");
        } else {
          // respond with '403 Forbidden' if verify tokens do not match
          res.sendStatus(403);
        }
    } catch(error) {
        console.error(error);
    }
}

export const whatsAppWebhook = async (req: any, res: any) => {
    try {
        const GRAPH_API_TOKEN = "EAAXKYuGhc0wBO95ZCfylLy1y2PYZB72Np6t8fOsYISqNqYBzHBJswaDZBkesxu3b2PBndGTgZAhHcdJtbNArkARPNVPRfv0BPAXSZAQ2DqoExPTbmZCqkFGrePVB0RVkejyTJFQmFcN88yYkWyZCbZBPROhssOv01kb0iyNf8pLAGkSJ4BWwLdMRuPMzcKUwKLENvszfHl8gJMh5eJzJwxELuD9SoDt3yixVtENY3hZBWJjdoA0XqcoCz"
        // log incoming messages
        console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));
        // check if the webhook request contains a message
        // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
        const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
        // check if the incoming message contains text
        if (message?.type === "text") {
          // extract the business number to send the reply from it
          const business_phone_number_id = req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
          // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
          console.log(GRAPH_API_TOKEN)
          await axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
              messaging_product: "whatsapp",
              to: message.from,
              text: { body: `Yes we got the message jhghjh` },
              context: {
                message_id: message.id, // shows the message as a reply to the original user message
              },
            },
          });
          // mark incoming message as read
          await axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
              messaging_product: "whatsapp",
              status: "read",
              message_id: message.id,
            },
          });
        res.sendStatus(200);
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
}

// Bulk whatsapp message
export const whatsAppBroadcast = async (req: Request, res: Response) => {
    try {
      const subscriberId: number = (req as any).user.userId;
      const {message} = req.body as { message: string };
      
      if(!subscriberId) {
        console.error("User id not found");
        res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
        return;
      }

      if(!message) {
        console.error("Message is mandatory");
        res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "Message is mandatory"));
        return;
      }

      const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);
      if(!existingSubscriber) {
        console.error("Subscriber not found");
        res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber not found!"));
        return;
      }

      const appDataSource = await getDataSource();
      const socialMediaLeadRepository = appDataSource.getRepository(Leads);
      const SubscriberWhatsappSettingsRepository = appDataSource.getRepository(SubscriberWhatsappSettings);
      const leadData = await socialMediaLeadRepository.findBy({ subscriberId: subscriberId });

      if(leadData.length > 0) {
        console.error("Lead data not found");
        res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Lead data not found!"));
        return;
      }

      const phoneNumbers = leadData.map(lead => lead.contactPhone);

      if(phoneNumbers.length === 0) {
        console.error("No numbers found for leads");
        res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "No numbers found for leads!"));
        return;
      }

      const subscriberWhatsappConfig = await SubscriberWhatsappSettingsRepository.findOneBy({subscriber: existingSubscriber });
      if(!subscriberWhatsappConfig) {
        console.error("Subscriber whatsapp settings not found");
        res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber whatsapp settings not found!"));
        return;
      }

      sendBulkWhatsappMessage(phoneNumbers, message, subscriberWhatsappConfig.accessToken, subscriberWhatsappConfig.phoneNoId)
        .then((results) => {
          console.log('Message delivery results:', results);
        })
        .catch((error) => {
          console.error('Error sending messages:', error);
          res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, "Error sending messages"));
          return;
        });

      res.status(SUCCESS_GET).send(CustomError(SUCCESS_GET, "Message sent successfully!"));
      return;
    } catch (error) {
        console.error(error);
        res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
        return;
    }
}