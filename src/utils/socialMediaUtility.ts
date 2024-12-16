import crypto from 'crypto';
import { adminSocialMedia } from '../socialMedia/dataModels/entities/adminSocialMedia.entity';
import { subscriberSocialMedia } from '../socialMedia/dataModels/entities/subscriberSocialMedia.entity';
import { AdminFacebookSettings } from '../socialMedia/dataModels/entities/adminFacebook.entity';
import { admins } from '../users/admin/dataModels/entities/admin.entity';
import { getDataSource } from './dataSource';
import { FacebookWebhookRequest, FetchMessageDetailsResponse, FetchMessageDetailsSuccessResponse, LeadData } from '../socialMedia/dataModels/types/meta.types';
import { SubscriberFacebookSettings } from '../socialMedia/dataModels/entities/subscriberFacebook.entity';
import { socialMediaType } from '../socialMedia/dataModels/enums/socialMedia.enums';
import { needsRefresh, subscriberFacebookRepo, subscriberSocialMediaRepo } from './common';
import { leadStatus } from '../leads/dataModels/enums/lead.enums';
import axios from 'axios';
// import { ngrokUrl } from '../server';

// Social Media Utility Constants
export const CLIENT_SUCCESS_URL = process.env.FRONTEND_SUCCESS_URL as string;
export const CLIENT_FAILED_URL = process.env.FRONTEND_FAILED_URL as string;

export const facebookStrategyConfig = {
  clientID: process.env.META_APP_ID as string,
  clientSecret: process.env.META_APP_SECRET as string,
  callbackURL: `${process.env.BACKEND_URL}/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'emails'],
  // enableProof: true,
  // state: true
}

// Social Media Utility Functions
export const verifySignature = (signature: string, rawBody: string, appSecret: string): boolean => {
  const signatureHash = signature.split('=')[1];

  const expectedHash = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return signatureHash === expectedHash;
};

export const fetchingLeadgenData = (body: FacebookWebhookRequest): { leadgenId: string, pageId: string } | undefined => {
    const { entry } = body;

    for (const page of entry) {
        for (const change of page.changes) {
            if (change.field === 'leadgen') {
                const leadgenId = change.value.leadgen_id;
                const pageId = change.value.page_id;

                // Return as soon as the leadgen data is found
                return { leadgenId, pageId };
            }
        }
    }

    // Return undefined if no leadgen data is found
    return undefined;
};

export const fetchingLeadDetails = async (pageAccessToken: string, leadgenId: string) => {
    const url = `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${pageAccessToken}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching lead data:', error);
      return null;
    }
}

// Get App Access Token
export const getAppAccessToken = async () => {
  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    let graphApiResponse = null;
    try {
      const url = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=client_credentials&client_id=${appId}&client_secret=${appSecret}`;
      const response = await fetch(url);
      graphApiResponse = await response.json();

      if(!graphApiResponse.access_token) {
        console.error("GET_APP_ACCESS_TOKEN:: Failed to obtain app access token");
        return;
      }
    } catch (error) {
      console.error('GET_APP_ACCESS_TOKEN:: Error while getting app access token', error);
      throw error;
    }

    // Update app access token
    const appDataSource = await getDataSource();
    const adminSocialMediaRepository = appDataSource.getRepository(adminSocialMedia);
    const adminFacebookRepository = appDataSource.getRepository(AdminFacebookSettings);
    const adminRepository = appDataSource.getRepository(admins);
    try {
      const adminSocialMediaData = await adminSocialMediaRepository.createQueryBuilder("adminSocialMedia")
        .leftJoinAndSelect("adminSocialMedia.admin", "admin")
        .leftJoinAndSelect("adminSocialMedia.facebook", "facebook")
        .getOne();
      if (adminSocialMediaData) {
        const adminFacebookData = await adminFacebookRepository.createQueryBuilder("adminFacebook").getOne();
        if(adminFacebookData) {
          adminFacebookData.appAccessToken = graphApiResponse.access_token;
          adminFacebookData.updatedAt = new Date();
          await adminFacebookRepository.save(adminFacebookData);
        }
      } else {
        const AdminFacebookSettingsEntity = new AdminFacebookSettings();
        AdminFacebookSettingsEntity.appAccessToken = graphApiResponse.access_token;
        await adminFacebookRepository.save(AdminFacebookSettingsEntity);

        const adminData = await adminRepository.createQueryBuilder("admin").getOne();
        if(!adminData) {
          console.error('GET_APP_ACCESS_TOKEN:: Admin not found');
          return;
        }

        const adminSocialMediaEntity = new adminSocialMedia();
        adminSocialMediaEntity.facebook = AdminFacebookSettingsEntity;
        adminSocialMediaEntity.admin = adminData
        await adminSocialMediaRepository.save(adminSocialMediaEntity);
      }
    } catch (error) {
      console.error('GET_APP_ACCESS_TOKEN:: Error while deleting old entries', error);
      throw error;
    }

    return console.log('GET_APP_ACCESS_TOKEN:: Admin app access token fetched and updated successfully');
  } catch (error) {
    console.log('GET_APP_ACCESS_TOKEN:: Error fetching app access token:', error);
  }
}

// Subscribe & Configure Webhook
export const subscribeWebhook = async (object: string, fields: string[]) => {
  try {
    const appDataSource = await getDataSource();
    const adminSocialMediaRepository = appDataSource.getRepository(adminSocialMedia);
    const adminSocialMediaQuerybuilder = adminSocialMediaRepository.createQueryBuilder('adminSocialMedia');

    const adminSocialMediaData = await adminSocialMediaQuerybuilder
      .leftJoinAndSelect("adminSocialMedia.admin", "admin")
      .leftJoinAndSelect("adminSocialMedia.facebook", "facebook")
      .getOne();

    if (!adminSocialMediaData) {
      console.error('WEBHOOK_SUBSCRIPTION:: No admin social media data found!');
      return;
    }

    const appId = process.env.META_APP_ID;
    const verifyToken = process.env.META_APP_VERIFY_TOKEN;
    const appAccessToken = adminSocialMediaData.facebook.appAccessToken;
    const url = `https://graph.facebook.com/v20.0/${appId}/subscriptions?access_token=${appAccessToken}`;

    // const callbackUrl = ngrokUrl + '/api/v1/meta/webhook';
    const callbackUrl = process.env.BACKEND_URL +'/api/v1/meta/webhook';

    const data = {
      object: object,
      fields: fields.join(','),
      access_token: appAccessToken,
      callback_url: callbackUrl,
      verify_token: verifyToken,
      include_values: 'true',
    };

    const headers= {'Content-Type': 'application/x-www-form-urlencoded'}

    // Use URLSearchParams to serialize the data
    const body = new URLSearchParams(data as Record<string, string>);
    const response = await fetch(url, { method: 'post', headers, body });
    const finalRes = await response.json();
    if(finalRes.error) {
      console.error('WEBHOOK_SUBSCRIPTION:: Error while subscribing webhook', finalRes.error);
      console.log("WEBHOOK_SUBSCRIPTION:: Webhook not subscribed!");
      return;
    }

    // Save webhook subscription status if it's successful
    adminSocialMediaData.isWebhookSubscribed = true;
    await adminSocialMediaRepository.save(adminSocialMediaData);
    return console.log('WEBHOOK_SUBSCRIPTION:: Webhook subscribed successfully');

  } catch (error) {
    console.log('WEBHOOK_SUBSCRIPTION:: Error while subscribing webhook',error);
    throw error;
  }
}

// Installing Meta App in Facebook Pages
export const installMetaApp = async (subscriberId: number) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
    const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");

    const subscriberFacebookDatas = await subscriberFacebookQueryBuilder
      .leftJoinAndSelect("subscriberFacebook.subscriberSocialMedia", "subscriberSocialMedia")
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .getMany();

    if (subscriberFacebookDatas.length > 0) {
      for (const invidualData of subscriberFacebookDatas) {
        const pageId = invidualData.pageId;
        const pageAccessToken = invidualData.pageAccessToken;

        // Check for valid pageId and access token
        if (!pageId || !pageAccessToken) {
          console.log('Invalid pageId or pageAccessToken');
          continue;
        }

        const url = `https://graph.facebook.com/v20.0/${pageId}/subscribed_apps`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscribed_fields: ['leadgen'],
            access_token: pageAccessToken,
          }),
        });

        const responseData = await response.json();
        if (!response.ok) {
          const errorData = await response.json();
          console.log('Error subscribing to Meta App:', errorData);
        } else {
          console.log('Successfully subscribed:', responseData);
        }
      }
      return console.log('Successfully Installed Meta App:');
    } else {
      return console.log(`No social media data found for subscriber with ID ${subscriberId}`);
    }
  } catch (error) {
    return console.log('Error while installing Meta App', error);
  }
};

export const getMetaUserAccessTokenDb = async (subscriberId: number) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");

    const subscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .where("subscriber.subscriberId = :subscriberId", { subscriberId })
      .andWhere("subscriberSocialMedia.socialMedia = :socialMedia", { socialMedia: socialMediaType.FACEBOOK })
      .getOne();

    if (!subscriberSocialMediaData) {
      console.log(`No facebook user access token found for subscriber with ID ${subscriberId}`);
      return null;
    }

    return subscriberSocialMediaData.userAccessToken;
  } catch (error) {
    console.log('Error while fetching user access token from database', error);
    throw error;
  }
}

export const fetchFacebookPages = async (userAccessToken: string) => {
  try {
    const response = await fetch(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.data;
  } catch (error) {
    console.log('Error while fetching page details', error);
    throw error;
  }
}

export const checkForAdminMetaConnection = async (): Promise<boolean> => {
  try {
    const appDataSource = await getDataSource();
    const adminSocialMediaRepository = appDataSource.getRepository(adminSocialMedia);
    const adminSocialMediaQuerybuilder = adminSocialMediaRepository.createQueryBuilder('adminSocialMedia');
    const adminSocialMediaData = await adminSocialMediaQuerybuilder
      .leftJoinAndSelect("adminSocialMedia.admin", "admin")
      .leftJoinAndSelect("adminSocialMedia.facebook", "facebook")
      .getOne();
    
    if(adminSocialMediaData && adminSocialMediaData.facebook.appAccessToken) return true;
    else return false;
  } catch (error) {
    console.log('Error while fetching admin social media details', error);
    throw error;
  }
}

export const checkWebhookSubscription = async (): Promise<boolean> => {
  try {
    const appDataSource = await getDataSource();
    const adminSocialMediaRepository = appDataSource.getRepository(adminSocialMedia);
    const adminSocialMediaQuerybuilder = adminSocialMediaRepository.createQueryBuilder('adminSocialMedia');
    const adminSocialMediaData = await adminSocialMediaQuerybuilder
      .leftJoinAndSelect("adminSocialMedia.admin", "admin")
      .leftJoinAndSelect("adminSocialMedia.facebook", "facebook")
      .getOne();
    
    if(adminSocialMediaData && adminSocialMediaData.isWebhookSubscribed) return true;
    else return false;
  } catch (error) {
    console.error('Error while checking webhook subscription', error);
    throw error;
  }
}

export const checkForSubscribersMetaConnection = async (subscriberId: number): Promise<boolean> => {
  try {
    const subscriberSocialMediaData = await subscriberSocialMediaRepo(subscriberId);
    if(subscriberSocialMediaData && subscriberSocialMediaData.userAccessToken) return true;
    else return false;
  } catch (error) {
    console.log("Error while fetching subscriber social media details!");
    throw error;
  }
}

export const getSubscribersWithExpiringTokens = async (subscriberId: number) => {
  try {
    const subscriberSocialMediaData = await subscriberFacebookRepo(subscriberId);
    if(!subscriberSocialMediaData) return null;
    return subscriberSocialMediaData;
  } catch (error) {
    console.log('Error while fetching subscriber social media details', error);
    throw error;
  }
}

// Convert short-lived token to long-lived token
export const getLongLivedUserToken = async (shortLivedToken: string) => {
  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const url = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
  
    const response = await fetch(url);
    const data = await response.json();
  
    if (data.access_token) {
      return data.access_token;
    } else {
      throw new Error("Failed to obtain long-lived token");
    }
  } catch (error) {
    console.log('Error while converting short-lived token to long-lived token', error);
    throw error;
  }
}

// Get page access token
export const getPageAccessToken = async (pageId: string, userAccessToken: string) => {
  try {
    if(!pageId || !userAccessToken) {
      throw new Error("Page ID or user access token is missing");
    }
    const url = `https://graph.facebook.com/v20.0/me/accounts?access_token=${userAccessToken}`;
  
    const response = await fetch(url);
    const data = await response.json();

    console.log(data);
  
    if (data.data && data.data.length > 0) {
      return data.data[0].access_token;
    } else {
      throw new Error("Failed to obtain page access token");
    }
  } catch (error) {
    console.log('Error while getting page access token', error);
    throw error;
  }
}

// Updating user access token in database
export const updateUserAccessTokenInDb = async (subscriberId: number, userAccessToken: string) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaData = await subscriberSocialMediaRepo(subscriberId);
    if (!subscriberSocialMediaData) {
      console.log(`No social media data found for subscriber with ID ${subscriberId}`);
      return null;
    }

    subscriberSocialMediaData.userAccessToken = userAccessToken;
    subscriberSocialMediaData.userTokenExpiresAt = new Date(Date.now() + 3600000);
    await subscriberSocialMediaRepository.save(subscriberSocialMediaData);
  } catch (error) {
    console.log('Error while updating user access token in database', error);
    throw error;
  }
}

// Updating page access token in database
export const updatePagesInDb = async (subscriberId: number, pageAccessToken: string) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
    const subscriberFacebookData = await subscriberFacebookRepo(subscriberId);
    
    if (!subscriberFacebookData) {
      console.log(`No social media data found for subscriber with ID ${subscriberId}`);
      return null;
    }

    subscriberFacebookData.pageAccessToken = pageAccessToken;
    subscriberFacebookData.pageTokenExpiresAt = new Date(Date.now() + 3600000);
    await subscriberFacebookRepository.save(subscriberFacebookData);
  } catch (error) {
    console.log('Error while updating page access token in database', error);
    throw error;
  }
}

// Refreshing facebook user and page access token
export const refreshAllTokens = async (subscriberId: number) => {
  const subscriber = await getSubscribersWithExpiringTokens(subscriberId);
  if (subscriber) {
    try {
      try {
        // Refresh user token if it's close to expiry
        if (subscriber.subscriberSocialMedia.userAccessToken && needsRefresh(subscriber.subscriberSocialMedia.userTokenExpiresAt)) {
          const newUserToken = await getLongLivedUserToken(subscriber.subscriberSocialMedia.userAccessToken);
          await updateUserAccessTokenInDb(subscriber.subscriberSocialMedia.subscriber.subscriberId, newUserToken);
        }
      } catch (error) {
        console.error("Error while refreshing user token:", error);
      }
  
      try {
        // Refresh page tokens if the user token was updated or nearing expiry
        if (subscriber.pageTokenExpiresAt && needsRefresh(subscriber.pageTokenExpiresAt)) {          
          const newPageTokens = await getPageAccessToken(subscriber.pageId, subscriber.subscriberSocialMedia.userAccessToken);
          console.log("newPageTokens:", newPageTokens);

          console.log("subscriberId:", subscriber.subscriberSocialMedia.subscriber.subscriberId);
          await updatePagesInDb(subscriber.subscriberSocialMedia.subscriber.subscriberId, newPageTokens);
        }
      } catch (error) {
        console.error("Error while refreshing page tokens:", error);
      }
    } catch (error) {
      console.error(`Error refreshing tokens for subscriber ${subscriber.subscriberSocialMedia.subscriber.subscriberId}:`, error);
    }
  }
};

export const findUserByProfileId = async (profileId: string) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
    const subscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .where("facebook.profileId = :profileId", { profileId })
      .getOne();
    
    if (!subscriberSocialMediaData) {
      console.log(`No social media data found for the user with ID ${profileId}`);
      return null;
    }

    return subscriberSocialMediaData;
  } catch (error) {
    console.error("Error while fetching user by profile id");
    throw error;
  }
}

export const parseLeadData = (leadData: LeadData, subscriberId: number) => {
  const parsedData: any = {
      leadText: `Enquiry from ${leadData.field_data?.find((f: any) => f.name === "full_name")?.values[0]}`,
      status: leadStatus.LEAD,
      contactEmail: leadData.field_data?.find((f: any) => f.name === "email")?.values[0],
      contactName: leadData.field_data?.find((f: any) => f.name === "full_name")?.values[0],
      subscriberId,
      companyName: leadData.field_data?.find((f: any) => f.name === "company_name")?.values[0] || null,
      contactPhone: leadData.field_data?.find((f: any) => f.name === "phone")?.values[0] || null,
      contactCountry: leadData.field_data?.find((f: any) => f.name === "country")?.values[0] || null,
      contactState: leadData.field_data?.find((f: any) => f.name === "state")?.values[0] || null,
      contactCity: leadData.field_data?.find((f: any) => f.name === "city")?.values[0] || null,
  };

  return parsedData.contactEmail && parsedData.contactName ? parsedData : null;
};

export const processMessages = async (msgDetails: FetchMessageDetailsSuccessResponse, subscriberId: number) => {
  try {
    let fromName;
    if(msgDetails.from.name) fromName = msgDetails.from.name;
    else if(msgDetails.from.username) fromName = msgDetails.from.username;
    else fromName = "";
    const parsedMessages = {
      leadText: `Enquiry from ${fromName}, Message:${msgDetails.message}`,
      status: leadStatus.LEAD,
      contactEmail: msgDetails.from.email ? msgDetails.from.email : "",
      contactName: fromName,
      subscriberId,
      companyName: fromName,
      contactPhone:"",
      contactCountry: "",
      contactState: "",
      contactCity: ""
    }

    return parsedMessages.contactEmail && parsedMessages.contactName ? parsedMessages : null;
  } catch (error) {
    console.error("Error while processing messages!");
    throw error; 
  }
}

export const fetchMessageDetails = async (messageId: string, pageAccessToken: string): Promise<FetchMessageDetailsResponse> => {
  try {
    const url = `https://graph.facebook.com/v21.0/${messageId}?fields=from,to,message&access_token=${pageAccessToken}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error while fetching sender details!");
    throw error;
  }
}