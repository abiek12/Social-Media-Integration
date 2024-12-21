import * as crypto from 'crypto'; // Correct
import { leadSource } from "../leads/dataModels/enums/lead.enums";
import { LeadsService } from "../leads/services/lead.service";
import { SubscriberFacebookSettings } from "../socialMedia/dataModels/entities/subscriberFacebook.entity";
import { FetchMessageDetailsResponse, LeadData } from "../socialMedia/dataModels/types/meta.types";
import { EXTERNAL_WEBHOOK_ENDPOINT_URL, WEBHOOK_SHARED_SECRET } from "./common";
import { getDataSource } from "./dataSource";
import { fetchingLeadDetails, fetchMessageDetails, parseLeadData, processMessages } from "./socialMediaUtility";
import axios from 'axios';


export const handleLeadgenEvent = async (event: any) => {
  try {
    const leadgenId = event.value.leadgen_id;
    const pageId = event.value.page_id;
  
    if (leadgenId && pageId) {
      const appDataSource = await getDataSource();
      const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
      const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");
      const subscriberFacebookData = await subscriberFacebookQueryBuilder
          .leftJoinAndSelect("subscriberFacebook.subscriberSocialMedia", "subscriberSocialMedia")
          .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
          .where("subscriberFacebook.pageId = :pageId", { pageId })
          .getOne();
      if(!subscriberFacebookData) {
        console.log(`No social media data found for the page with ID ${pageId}`);
        return;
      }
      const subscriberId = subscriberFacebookData.subscriberSocialMedia.subscriber.subscriberId;
      const pageAccessToken = subscriberFacebookData.pageAccessToken;

      const leadData: LeadData = await fetchingLeadDetails(pageAccessToken, leadgenId);
      if (!leadData) {
        console.log(`No lead data found for the leadgen with ID ${leadgenId}`);
        return;
      }
      let source = leadSource.FACEBOOK;
      const parsedLead = parseLeadData(leadData, subscriberId);
      if (parsedLead) {
          const leadsService = new LeadsService();
          await leadsService.createSubscribersLeads(parsedLead, source);
      }
    }
  } catch (error) {
    console.error("Error while handling leadgen event");
    throw error;
  }
}

export const handleMessagingEvent = async (event: any, source: string) => {
  try {
    const messageId = event.message.mid;
    const senderId = event.sender.id;
    const pageId = event.recipient.id;

    if(!pageId) {
      console.error('RecipientId or PageId is missing!');
      return;
    }

    if(!messageId) {
      console.error("Message id is missing!")
      return;
    }

    // Find out the user related to this message
    const appDataSource = await getDataSource();
    const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
    const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");
    const subscriberFacebookData = await subscriberFacebookQueryBuilder
        .leftJoinAndSelect("subscriberFacebook.subscriberSocialMedia", "subscriberSocialMedia")
        .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
        .where("subscriberFacebook.pageId = :pageId", { pageId })
        .getOne();

    if(!subscriberFacebookData) {
      console.log(`No social media data found for the page with ID ${pageId}`);
      return;
    }

    const subscriberId = subscriberFacebookData.subscriberSocialMedia.subscriber.subscriberId;
    const pageAccessToken = subscriberFacebookData.pageAccessToken;

    if(!pageAccessToken) {
      console.error("Page access tokekn is missing for the page id!");
      return;
    }

    const msgDetails: FetchMessageDetailsResponse = await fetchMessageDetails(messageId, pageAccessToken);
    if("error" in msgDetails) {
      console.error("Error while fetching fetching messages!");
      return;
    }
    console.log(msgDetails);
    const processedMessage = await processMessages(msgDetails, subscriberId);
    if(processedMessage) {
      const leadsService = new LeadsService();
      await leadsService.createSubscribersLeads(processedMessage, source);
    }
  } catch (error) {
    console.error("Error while handling messaging event");
    throw error;
  }
};

// Convert to lead Webhook
export const sendLeadDataToWebhookEndpoint = async (payload: any, externalUrl: string, webhookSharedSecret: string) => {
  try {
        // Generate HMAC signature
        let signature;
        try {
            signature = crypto.createHmac('sha256', webhookSharedSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
        } catch (error) {
            console.error("Error while generating HMAC Signature!");
            throw error;
        }

        // Send POST request to external server
        try {
            const response = await axios.post(
                externalUrl,
                { payload },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Hook-Signature': signature, // Add signature for authentication
                    },
                    timeout: 5000 // Set timeout of 5 seconds
                }
            );

            // Check if the response status indicates success
            if (response.status >= 200 && response.status < 300) {
                console.error(response);
                return { success: true, data: response.data, status: response.status };
            } else {
                console.error(response);
                return { success: false, error: `Unexpected status code: ${response.status}`, status: response.status };
            }
        } catch (error) {
            console.error("Error while sending webhook data!");
            throw error;
        }
  } catch (error) {
    console.error("Error while sending data to the webhook endpoint!");
    throw error;
  }
}