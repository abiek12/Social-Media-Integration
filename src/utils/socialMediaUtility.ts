import crypto from 'crypto';
import { adminSocialMedia } from '../socialMedia/dataModels/entities/adminSocialMedia.entity';
import { subscriberSocialMedia } from '../socialMedia/dataModels/entities/subscriberSocialMedia.entity';
import { AdminFacebookSettings } from '../socialMedia/dataModels/entities/adminFacebook.entity';
import { admins } from '../users/admin/dataModels/entities/admin.entity';
import { getDataSource } from './dataSource';
import { FacebookWebhookRequest } from '../socialMedia/dataModels/types/meta.types';
// import { ngrokUrl } from '../server';

// Social Media Utility Constants
export const CLIENT_URL = process.env.FRONTEND_URL as string;
export const CLIENT_FAILED_URL = process.env.FRONTEND_FAILED_URL as string;

export const facebookStrategyConfig = {
  clientID: process.env.META_APP_ID as string,
  clientSecret: process.env.META_APP_SECRET as string,
  callbackURL: (process.env.BACKEND_URL as string) + '/callback',
  profileFields: ['id', 'displayName', 'emails'],
  state: true
}

// Social Media Utility Functions
export const verifySignature = (signature: string | undefined, body: any, appSecret: string): boolean => {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }
  const elements = signature.split('=');  
  const method = elements[0];
  const signatureHash = elements[1];

  // Convert body to a JSON string for hashing
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);

  const expectedHash = crypto.createHmac('sha256', appSecret).update(bodyString).digest('hex');
  return signatureHash === expectedHash;
};

export const fetchingLeadgenData = (body: FacebookWebhookRequest): any=>{
    const { entry } = body;
    entry.forEach(page => {
        page.changes.forEach(change => {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id;
            const pageId = change.value.page_id;
            
            return {leadgenId, pageId};
          }
        });
    });
}

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
export const subscribeWebhook = async () => {
  try {
    const appDataSource = await getDataSource();
    const adminSocialMediaRepository = appDataSource.getRepository(adminSocialMedia);
    const adminSocialMediaQuerybuilder = adminSocialMediaRepository.createQueryBuilder('adminSocialMedia');

    const adminSocialMediaData = await adminSocialMediaQuerybuilder
      .leftJoinAndSelect("adminSocialMedia.admin", "admin")
      .leftJoinAndSelect("adminSocialMedia.facebook", "facebook")
      .getOne();

    if(adminSocialMediaData) {
      const appId = process.env.META_APP_ID;
      const verifyToken = process.env.META_APP_VERIFY_TOKEN;
      const callbackUrl = process.env.NGROK_URL +'/api/v1/meta/webhook';      
      // const callbackUrl = ngrokUrl + '/api/v1/meta/webhook';
      const appAccessToken = adminSocialMediaData.facebook.appAccessToken;

      const url = `https://graph.facebook.com/v20.0/${appId}/subscriptions?access_token=${appAccessToken}`;
      const data = {
        object: 'page',
        fields: [
          'leadgen',
        ],
        access_token: appAccessToken,
        callback_url: callbackUrl,
        include_values: 'true',
        verify_token: verifyToken,
      };

      const headers= {
        'Content-Type': 'application/x-www-form-urlencoded',
      }

      const bodyData = {
          ...data,
          fields: data.fields.join(','),
      };
      // Use URLSearchParams to serialize the data
      const body = new URLSearchParams(bodyData as Record<string, string>);

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
    }

  } catch (error) {
    console.log('WEBHOOK_SUBSCRIPTION:: Error while subscribing webhook',error);
    throw error;
  }
}

// Installing Meta App in Facebook Pages
export const installMetaApp = async (subscriberId: number) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");

    const subscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
      .where("subscriber.subscriberId = :subscriberId", { subscriberId })
      .getOne();

    if (subscriberSocialMediaData) {
      const pageId = subscriberSocialMediaData.facebook.pageId;
      const pageAccessToken = subscriberSocialMediaData.facebook.pageAccessToken;

      const url = `https://graph.facebook.com/v20.0/${pageId}/subscribed_apps`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscribed_fields: 'leadgen',
          access_token: pageAccessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error subscribing to Meta App:', errorData);
        return;
      }

      const responseData = await response.json();
      return console.log('Successfully Installed Meta App:', responseData);
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
      .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
      .where("subscriber.subscriberId = :subscriberId", { subscriberId })
      .getOne();
    
    if (!subscriberSocialMediaData) {
      console.log(`No facebook user access token found for subscriber with ID ${subscriberId}`);
      return null;
    }

    return subscriberSocialMediaData.facebook.userAccessToken;
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

const subscriberSocialMediaRepo = async (subscriberId: number) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
    const subscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
      .where("subscriber.subscriberId = :subscriberId", { subscriberId })
      .getOne();
    return subscriberSocialMediaData;
  } catch (error) {
    console.log("Error while fetching subscriber social media repo");
    throw error;
  }
}

export const checkForSubscribersMetaConnection = async (subscriberId: number): Promise<boolean> => {
  try {
    const subscriberSocialMediaData = await subscriberSocialMediaRepo(subscriberId);
    if(subscriberSocialMediaData && subscriberSocialMediaData.facebook.userAccessToken) return true;
    else return false;
  } catch (error) {
    console.log("Error while fetching subscriber social media details!");
    throw error;
  }
}

export const getSubscribersWithExpiringTokens = async (subscriberId: number) => {
  try {
    const subscriberSocialMediaData = await subscriberSocialMediaRepo(subscriberId);
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
    const url = `https://graph.facebook.com/v20.0/${pageId}/accounts?access_token=${userAccessToken}`;
  
    const response = await fetch(url);
    const data = await response.json();
  
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
    const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
    const subscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
      .where("subscriber.subscriberId = :subscriberId", { subscriberId })
      .getOne();
    
    if (!subscriberSocialMediaData) {
      console.log(`No social media data found for subscriber with ID ${subscriberId}`);
      return null;
    }

    subscriberSocialMediaData.facebook.userAccessToken = userAccessToken;
    subscriberSocialMediaData.facebook.userTokenExpiresAt = new Date(Date.now() + 3600000);
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
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
    const subscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
      .where("subscriber.subscriberId = :subscriberId", { subscriberId })
      .getOne();
    
    if (!subscriberSocialMediaData) {
      console.log(`No social media data found for subscriber with ID ${subscriberId}`);
      return null;
    }

    subscriberSocialMediaData.facebook.pageAccessToken = pageAccessToken;
    subscriberSocialMediaData.facebook.pageTokenExpiresAt = new Date(Date.now() + 3600000);
    await subscriberSocialMediaRepository.save(subscriberSocialMediaData);
  } catch (error) {
    console.log('Error while updating page access token in database', error);
    throw error;
  }
}

// Helper function to check if token needs refreshing
const needsRefresh = (expiryDate: string | Date) => {
  const refreshThreshold = 7 * 24 * 60 * 60 * 1000; // e.g., 7 days before expiry
  const expiryTimestamp = new Date(expiryDate).getTime();
  const currentTimestamp = Date.now();
  
  // Check if the time remaining before expiry is less than the threshold
  return expiryTimestamp - currentTimestamp < refreshThreshold;
};

// Refreshing facebook user and page access token
export const refreshAllTokens = async (subscriberId: number) => {
  const subscriber = await getSubscribersWithExpiringTokens(subscriberId);
  if (subscriber) {
    try {
      // Refresh user token if it's close to expiry
      if (subscriber.facebook.userTokenExpiresAt && needsRefresh(subscriber.facebook.userTokenExpiresAt)) {
        const newUserToken = await getLongLivedUserToken(subscriber.facebook.userAccessToken);
        await updateUserAccessTokenInDb(subscriber.subscriber.subscriberId, newUserToken);
      }
  
      // Refresh page tokens if the user token was updated or nearing expiry
      if (subscriber.facebook.pageTokenExpiresAt && needsRefresh(subscriber.facebook.pageTokenExpiresAt)) {
        const newPageTokens = await getPageAccessToken(subscriber.facebook.pageId, subscriber.facebook.userAccessToken);
        await updatePagesInDb(subscriber.subscriber.subscriberId, newPageTokens);
      }
    } catch (error) {
      console.error(`Error refreshing tokens for subscriber ${subscriber.subscriber.subscriberId}:`, error);
    }
  }
};
