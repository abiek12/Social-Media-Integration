import { LeadsService } from "../../leads/services/lead.service";
import { getDataSource } from "../../utils/dataSource";
import { fetchingLeadDetails, fetchSenderDetails, parseLeadData } from "../../utils/socialMediaUtility";
import { SubscriberFacebookSettings } from "../dataModels/entities/subscriberFacebook.entity";
import { LeadData } from "../dataModels/types/meta.types";

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

      const parsedLead = parseLeadData(leadData, subscriberId);
      if (parsedLead) {
          const leadsService = new LeadsService();
          await leadsService.createSubscribersLeads(parsedLead);
      }
    }
  } catch (error) {
    console.error("Error while handling leadgen event");
    throw error;
  }
}

export const handleMessagingEvent = async (event: any) => {
  try {
    const message = event.message;
    const senderId = event.sender.id;
    const pageId = event.recipient.id;
    console.log('New Message:', { message, senderId, pageId });

    if(!message || !pageId) {
      console.error('Message or recipientId is missing');
      return;
    }

    if(!senderId) {
      console.error("Sender id is missing!")
      return;
    }

    const pageAccessToken =  "EAAHdP3GumlsBO6mtAvltAOPTJjgTAkI53FGRrOwbZAOc6t01gs9hC2HlqabipIJsSxVgtoTOjGVZBzduaZBGUdqIZA58TgGCvv8Hsqd0DbZC2lgu4u7vODOxug9AXVAWCFjchT9e5QC3B4nGVYZBtzjsDa5KBPOxRvMrlEXlQUD7v3UqGEUjDMJ0VvanlFWtEnlBbWlwMKtbysJ2wq30yjZBuitkIIZCXVFWkZBfe2gKd"
    if(!pageAccessToken) {
      console.error("Page access tokekn is missing for the page id!");
      return;
    }

    const senderDetails = await fetchSenderDetails(senderId, pageAccessToken)
    if(!senderDetails) {
      console.error("Sender does'nt exist!");
      return;
    }
    console.log(senderDetails);

  } catch (error) {
    console.error("Error while handling messaging event");
    throw error;
  }
};
  