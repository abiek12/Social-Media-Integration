import axios from "axios";
import { Request, Response } from "express";
import { BAD_REQUEST, checkExistingWhatsappConfig, checkSubscriberExitenceUsingId, CONFLICT, ERROR_COMMON_MESSAGE, FORBIDDEN, INTERNAL_ERROR, NOT_AUTHORIZED, NOT_FOUND, SUCCESS_GET } from "../../utils/common";
import { CustomError, Success } from "../../utils/response";
import { getDataSource } from "../../utils/dataSource";
import { quickReply, sendBulkWhatsappMessage } from "../../utils/socialMediaUtility";
import { SubscriberWhatsappSettings } from "../dataModels/entities/subscriberWhatsapp.entity";
import { LeadsService } from "../../leads/services/lead.service";
import { leadSource, leadStatus } from "../../leads/dataModels/enums/lead.enums";
import { subscriberLeads } from "../../leads/dataModels/entities/convertedLead.entity";
import { WhatsappMessages } from "../dataModels/types/meta.types";

export const verifyWhatsappWebhook = async (req: any, res: any) => {
    try {
        const WEBHOOK_VERIFY_TOKEN = process.env.META_APP_VERIFY_TOKEN;
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];
        // check the mode and token sent are correct
        if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
          // respond with 200 OK and challenge token from the request
          res.status(SUCCESS_GET).send(challenge);
          console.log("Webhook verified successfully!");
        } else {
          // respond with '403 Forbidden' if verify tokens do not match
          res.sendStatus(FORBIDDEN);
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


// Whatsapp webhook v2
export const whatsAppWebhookV2 = async (req: Request, res: Response) => {
  try {
    console.log("Whatsapp webhook event received!");
    const payload = req.body;
    console.log(payload);
    const messageData: WhatsappMessages = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const phoneNoId = payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

    if (messageData?.type === "text") {
      if(!messageData) {
        console.error("Message field is empty!");
        return;
      }

      if(!messageData.from) {
        console.error("From phone number is missing!");
        return;
      }

      if(!phoneNoId) {
        console.error("Buisness phone number id is missing!");
        return;
      }

      // find out the user related to the message
      const appDataSource = await getDataSource();
      const subscriberWhatsappSettingsQueryBuilder = appDataSource
        .getRepository(SubscriberWhatsappSettings)
        .createQueryBuilder("subscriberWhatsappSettings");

      const subscribersWhatsappSettings = await subscriberWhatsappSettingsQueryBuilder
        .leftJoinAndSelect("subscriberWhatsappSettings.subscriber", "subscriber")
        .where("subscriberWhatsappSettings.phoneNoId =:id", {id: phoneNoId})
        .getOne();

      if(!subscribersWhatsappSettings) {
        console.error("No matching user present with this message!");
        return;
      }

      const neccesaryData = {
        name: payload.entry?.[0]?.changes[0]?.value?.contacts?.[0]?.profile?.name,
        phoneNumber: messageData.from,
        message: messageData.text.body,
        messageId: messageData.id
      }

      const leadData = {
        leadText: `Enquiry from ${neccesaryData.name}, Message:${neccesaryData.message}`,
        status: leadStatus.LEAD,
        contactEmail: "",
        contactName: neccesaryData.name,
        subscriberId: subscribersWhatsappSettings.subscriber.subscriberId,
        companyName: neccesaryData.name,
        contactPhone: neccesaryData.phoneNumber,
        contactCountry: "",
        contactState: "",
        contactCity: ""
      }

      const leadsService = new LeadsService();
      await leadsService.createSubscribersLeads(leadData, leadSource.WHATSAPP);

      if(subscribersWhatsappSettings.accessToken) {
        const message = "Hi thanks for your message, we will contact you soon!"
        await quickReply(subscribersWhatsappSettings.accessToken, phoneNoId, neccesaryData.phoneNumber, neccesaryData.messageId, message)
      }

      // returing success ok acknowledgement
      res.sendStatus(SUCCESS_GET);
    }

  } catch (error) {
    console.error("Error while sending bulk whatsapp message: ", error);
    res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
    return;
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
      const convertedLeadRepository = appDataSource.getRepository(subscriberLeads);
      const convertedLeadQueryBuilder = convertedLeadRepository.createQueryBuilder("leads");
      const leadData = await convertedLeadQueryBuilder
        .where("leads.subscriberId =:subscriberId", {subscriberId: subscriberId})
        .andWhere("leads.isDeleted = :isDeleted", {isDeleted: false})
        .getMany();

      if(leadData.length === 0) {
        console.error("Lead data not found");
        res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Lead data not found!"));
        return;
      }

      const phoneNumbers = leadData.map(lead => lead.contactPhone).filter(phone => phone);

      if(phoneNumbers.length === 0) {
        console.error("No numbers found for leads");
        res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "No numbers found for leads!"));
        return;
      }

      const subscriberWhatsappSettingsQueryBuilder = appDataSource.getRepository(SubscriberWhatsappSettings).createQueryBuilder("subscriberWhatsapp");
      const subscriberWhatsappConfig = await subscriberWhatsappSettingsQueryBuilder
        .leftJoinAndSelect("subscriberWhatsapp.subscriber", "subscriber")
        .where("subscriber.subscriberId =:id", {id: existingSubscriber.subscriberId})
        .getOne();

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

      res.status(SUCCESS_GET).send(Success("Message sent successfully!"));
      return;
    } catch (error) {
        console.error("Error while sending bulk whatsapp message: ", error);
        res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
        return;
    }
}

// Get user whatsapp config
export const getWhatsappConfig = async (req: Request, res: Response) => {
  try {
    const subscriberId: number = (req as any).user.userId;
    if(!subscriberId) {
      console.error("User id not found");
      res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
      return;
    }
    
    const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);
    if(!existingSubscriber) {
      console.error("Subscriber not found");
      res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber not found!"));
      return;
    }

    const appDataSource = await getDataSource();
    const subscriberWhatsappSettingsQueryBuilder = appDataSource.getRepository(SubscriberWhatsappSettings).createQueryBuilder("subscriberWhatsapp");
    const subscriberWhatsappConfig = await subscriberWhatsappSettingsQueryBuilder
      .leftJoinAndSelect("subscriberWhatsapp.subscriber", "subscriber")
      .where("subscriber.subscriberId =:id", {id: existingSubscriber.subscriberId})
      .getOne();

    const data = {
      subscriberId: subscriberWhatsappConfig?.subscriber.subscriberId,
      id: subscriberWhatsappConfig?.subWhatsappSettingsId,
      accessToken: subscriberWhatsappConfig?.accessToken,
      phoneNoId: subscriberWhatsappConfig?.phoneNoId,
      waId: subscriberWhatsappConfig?.waId,
      ...(subscriberWhatsappConfig && { webhookEndpoint: `${process.env.BACKEND_URL}/api/v1/whatsapp/webhook` })
    }

    res.status(SUCCESS_GET).send(Success(data));
    return;
  } catch (error) {
    console.error("Error while getting user whatsapp config: ", error);
    res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
    return;
  }
}

// Create user whatsapp config
export const createWhatsappConfig = async (req: Request, res: Response) => {
  try {
    const subscriberId: number = (req as any).user.userId;
    const {accessToken, phoneNoId, waId} = req.body as { accessToken: string, phoneNoId: string, waId: string };
    // input validations
    if(!subscriberId) {
      console.error("User id not found");
      res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
      return;
    }

    if(!accessToken || !phoneNoId) {
      console.error("Missing required parameters: accessToken or phoneNoId");
      res.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Missing required parameters: accessToken or phoneNoId."));
      return;
    }

    const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);
    if(!existingSubscriber) {
      console.error("Subscriber not found");
      res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber not found!"));
      return;
    }

    const existingConfig = await checkExistingWhatsappConfig(phoneNoId);
    if(existingConfig) {
      console.error("This whatsapp configuration already exists!");
      res.status(CONFLICT).send(CustomError(CONFLICT, "This whatsapp configuration already exists!"));
      return;
    }

    const appDataSource = await getDataSource();
    const SubscriberWhatsappSettingsRepository = appDataSource.getRepository(SubscriberWhatsappSettings);
    const whatsappSettingsEntity =  new SubscriberWhatsappSettings()
    whatsappSettingsEntity.subscriber = existingSubscriber;
    whatsappSettingsEntity.accessToken = accessToken;
    whatsappSettingsEntity.phoneNoId = phoneNoId;
    whatsappSettingsEntity.waId = waId ?? null;

    try {
      await SubscriberWhatsappSettingsRepository.save(whatsappSettingsEntity);
      res.status(SUCCESS_GET).send(Success("User whatsapp config created successfully!"));
      return;
    } catch (error) {
      console.error("Error while creating user whatsapp config: ", error);
      res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
      return;
    }

  } catch (error) {
    console.error("Error while creating user whatsapp config: ", error);
    res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
    return;
  }
}

// update user whatsapp config
export const updateWhatsappConfig = async (req: Request, res: Response) => {
  try {
    const subscriberId: number = (req as any).user.userId;
    const {id, accessToken, phoneNoId, waId} = req.body as { id: number, accessToken: string, phoneNoId: string, waId: string };
    // input validations
    if(!subscriberId) {
      console.error("User id not found");
      res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
      return;
    }

    const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);
    if(!existingSubscriber) {
      console.error("Subscriber not found");
      res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber not found!"));
      return;
    }

    const appDataSource = await getDataSource();
    const SubscriberWhatsappSettingsRepository = appDataSource.getRepository(SubscriberWhatsappSettings);
    const subscriberWhatsappSettingsQueryBuilder = SubscriberWhatsappSettingsRepository.createQueryBuilder("subscriberWhatsapp");
    const subscriberWhatsappConfig = await subscriberWhatsappSettingsQueryBuilder
      .leftJoinAndSelect("subscriberWhatsapp.subscriber", "subscriber")
      .where("subscriber.subscriberId =:subscriberId", {subscriberId: existingSubscriber.subscriberId})
      .andWhere("subscriberWhatsapp.subWhatsappSettingsId =:id", {id: id})
      .getOne();

    if(!subscriberWhatsappConfig) {
      console.error("Subscriber whatsapp config not found");
      res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber whatsapp config not found!"));
      return;
    }

    const existingConfig = await checkExistingWhatsappConfig(phoneNoId, id);
    if(existingConfig) {
      console.error("This whatsapp configuration already exists!");
      res.status(CONFLICT).send(CustomError(CONFLICT, "This whatsapp configuration already exists!"));
      return;
    }

    subscriberWhatsappConfig.accessToken = accessToken ? accessToken : subscriberWhatsappConfig.accessToken;
    subscriberWhatsappConfig.phoneNoId = phoneNoId ? phoneNoId : subscriberWhatsappConfig.phoneNoId;
    subscriberWhatsappConfig.waId = "waId" in req.body ? waId : subscriberWhatsappConfig.waId;
    await SubscriberWhatsappSettingsRepository.save(subscriberWhatsappConfig);

    res.status(SUCCESS_GET).send(Success("User whatsapp config updated successfully!"));
    return;
  } catch (error) {
    console.error("Error while updating user whatsapp config: ", error);
    res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
    return;
  }
}

// Delete user whatsapp config
export const deleteWhatsappConfig = async (req: Request, res: Response) => {
  try {
    const subscriberId: number = (req as any).user.userId;
    const id = (req as any).params.id;
    // input validations
    if(!subscriberId) {
      console.error("User id not found");
      res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
      return;
    }

    if(!id) {
      console.error("Missing required parameters: id");
      res.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Missing required parameters: id."));
      return;
    }

    const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);
    if(!existingSubscriber) {
      console.error("Subscriber not found");
      res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber not found!"));
      return;
    }

    const appDataSource = await getDataSource();
    const subscriberWhatsappSettingsRepository = appDataSource.getRepository(SubscriberWhatsappSettings);
    const subscriberWhatsappSettingsQueryBuilder = subscriberWhatsappSettingsRepository.createQueryBuilder("subscriberWhatsapp");
    const subscriberWhatsappConfig = await subscriberWhatsappSettingsQueryBuilder
      .leftJoinAndSelect("subscriberWhatsapp.subscriber", "subscriber")
      .where("subscriber.subscriberId =:subscriberId", {subscriberId: existingSubscriber.subscriberId})
      .andWhere("subscriberWhatsapp.subWhatsappSettingsId =:id", {id: id})
      .getOne();

    if(!subscriberWhatsappConfig) {
      console.error("Subscriber whatsapp config not found");
      res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber whatsapp config not found!"));
      return;
    }

    await subscriberWhatsappSettingsRepository.createQueryBuilder()
      .delete()
      .where("subWhatsappSettingsId = :id", { id: id })
      .execute();

    res.status(SUCCESS_GET).send(Success("User whatsapp config deleted successfully!"));
    return;
  } catch (error) {
    console.error("Error while deleting user whatsapp config: ", error);
    res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
    return;
  }
}