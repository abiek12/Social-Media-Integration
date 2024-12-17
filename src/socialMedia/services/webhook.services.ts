import { leadSource } from "../../leads/dataModels/enums/lead.enums";
import { LeadsService } from "../../leads/services/lead.service";
import { getDataSource } from "../../utils/dataSource";
import { fetchingLeadDetails, fetchMessageDetails, parseLeadData, processMessages } from "../../utils/socialMediaUtility";
import { SubscriberFacebookSettings } from "../dataModels/entities/subscriberFacebook.entity";
import { FetchMessageDetailsResponse, LeadData } from "../dataModels/types/meta.types";

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
    const pageAccessToken = subscriberFacebookData.pageAccessToken || 'EAAHdP3GumlsBO1nvZBY3KtFaIq9WdhGvH2kNAGuFrTinjeHdRgDuJrfJZAZCjDKz1tLpcauv0YBH673vbx3ETAZBWE8wKk5UXp3jNXCdS5brQgHnK5HqcurJwvZCbnDqY9F6XoEa4xM6u8dGfbc8niDYqNjvwwTaH1dEZCr8XvfH5IqkTHVq5eCUiKoyfmnXAwzkvrHRypvKJmZAQ0CqaCYsMK9v34y37UkGmqdQqIP';

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
    console.log(processedMessage);
    if(processedMessage) {
      const leadsService = new LeadsService();
      await leadsService.createSubscribersLeads(processedMessage, source);
    }
  } catch (error) {
    console.error("Error while handling messaging event");
    throw error;
  }
};
  