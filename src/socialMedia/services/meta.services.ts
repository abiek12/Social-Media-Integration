import { Request, Response } from "express";
import { subscriberSocialMedia } from "../dataModels/entities/subscriberSocialMedia.entity";
import { SubscriberFacebookSettings } from "../dataModels/entities/subscriberFacebook.entity";
import { getDataSource } from "../../utils/dataSource";
import { pageMetaDataTypes, VerificationData } from "../dataModels/types/meta.types";
import { CustomError, Success } from "../../utils/response";
import { BAD_REQUEST, checkSubscriberExitenceUsingId, CONFLICT, ERROR_COMMON_MESSAGE, FORBIDDEN, INTERNAL_ERROR, NOT_AUTHORIZED, NOT_FOUND, SUCCESS_GET } from "../../utils/common";
import { fetchFacebookPages, getMetaUserAccessTokenDb, installMetaApp, verifySignature } from "../../utils/socialMediaUtility";
import { socialMediaType } from "../dataModels/enums/socialMedia.enums";
import { handleLeadgenEvent, handleMessagingEvent } from "./webhook.services";

export class metaServices {
    // Meta Webhook Verification Endpoint
    verifyWebhook = async (request: Request, response: Response) => {
        const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query as VerificationData;
        if (mode === 'subscribe' && token === process.env.META_APP_VERIFY_TOKEN) {
            response.status(SUCCESS_GET).send(challenge);
            console.log('WEBHOOK:: Verified webhook');
            return;
        }
        response.status(FORBIDDEN).send('Forbidden');
    }

    // Meta Webhook Event Notification Endpoint
    handleWebhook = async (request: Request, response: Response) => {
        try {
            const signature = request.headers['x-hub-signature'] as string | undefined;
            const body = request.body;
            console.log(body);
            console.log(body.entry[0].changes);
            console.log(body.entry[0].changes[0]);
        
            const appSecret = process.env.META_APP_SECRET;
            if (!appSecret) {
                console.error('META_APP_SECRET is not defined');
                response.status(FORBIDDEN).send(CustomError(FORBIDDEN, 'META_APP_SECRET is not defined'));
                return;
            }

            // const rawBody = (request as any).rawBody; 
            // if (!verifySignature(signature, body, appSecret)) {
            //     console.error('App Secret is not valid');
            //     response.status(FORBIDDEN).send(CustomError(FORBIDDEN, 'Forbidden'));
            //     return;
            // }
        
            // Validate Signature
            if (!verifySignature(signature, body, appSecret)) {
                console.error('Invalid signature');
                response.status(FORBIDDEN).send(CustomError(FORBIDDEN, 'Invalid signature'));
                return;
            }
        
            // Acknowledge the webhook event
            console.info("request header X-Hub-Signature validated");
            console.log("Event Received:", body);
            response.status(SUCCESS_GET).send('EVENT_RECEIVED');
        
            // Process events
            const { entry } = body;
            for (const pageEntry of entry) {
              for (const change of pageEntry.changes) {
                switch (change.field) {
                  case 'leadgen':
                    await handleLeadgenEvent(change);
                    break;
                
                  case 'messages':
                    await handleMessagingEvent(change);
                    break;
                
                //   case 'instagram':
                //     await handleInstagramEvent(change);
                //     break;
                
                  default:
                    console.warn(`Unhandled event field: ${change.field}`);
                }
              }
            }
        } catch (error) {
            console.error('Error processing webhook event:', error);
        }
    };


    // Fetch facebook pages of the subscriber.
    fetchPages = async (request: Request, response: Response) => {
        try {
            const subscriberId: number = (request as any).user.userId;
            const userAceessToken: string | null = await getMetaUserAccessTokenDb(subscriberId);
            if(!userAceessToken) {
                console.error("User not authenticated to fetch facebook pages!");
                response.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User not authenticated to fetch facebook pages!"));
                return;
            }
            const pageDetails = await fetchFacebookPages(userAceessToken);
            response.status(SUCCESS_GET).send(Success(pageDetails));
            return;
        } catch (error) {
            console.error("Error in fetching facebook pages", error);
            response.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
            return;
        }
    }


    // Handler for choosing facebook pages
    choosePages = async (request: Request, response: Response) => {
        try {            
            const subscriberId: number = (request as any).user.userId;
            const {pages} = request.body as {pages: pageMetaDataTypes[]};
            
            if(pages.length === 0 ) {
                console.error("Page data not found");
                response.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Page data not found!"));
                return;
            }

            const appDataSource = await getDataSource();
            const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
            const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
            const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");

            const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);

            if(!existingSubscriber) {
                console.error("Subscriber not found");
                response.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber not found!"));
                return;
            }
            const existingSubscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
                .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
                .andWhere("subscriberSocialMedia.socialMedia = :socialMedia", { socialMedia: socialMediaType.FACEBOOK })
                .where("subscriber.subscriberId = :subscriberId", { subscriberId })
                .getOne();
            
            if(!existingSubscriberSocialMediaData) {
                console.error("Subscriber not authenticated to fetch facebook pages!");
                response.status(CONFLICT).send(CustomError(CONFLICT, "Subscriber not authenticated to fetch facebook pages!"));
                return;
            }

            for (const pageData of pages) {
                const pageExistance = await subscriberFacebookRepository.findOneBy({ pageId: pageData.id });
                if(!pageExistance) {
                    const subscriberFacebookEntity = new SubscriberFacebookSettings();
                    subscriberFacebookEntity.pageId = pageData.id;
                    subscriberFacebookEntity.pageAccessToken = pageData.access_token;
                    subscriberFacebookEntity.pageName = pageData.name;
                    subscriberFacebookEntity.pageTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
                    subscriberFacebookEntity.subscriberSocialMedia = existingSubscriberSocialMediaData;
                    await subscriberFacebookRepository.save(subscriberFacebookEntity);
                }
            }

            // Installing meta app on the subscriber's facebook pages
            await installMetaApp(subscriberId);

            console.info("Pages added successfully");
            response.status(SUCCESS_GET).send(Success("Pages added successfully!"));
            return;
        } catch (error) {
            console.error("Error in fetching facebook pages", error);
            response.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
            return;
        }
    }
    
    // Handler for checking facebook status
    checkFacebookStatus = async (request: Request, response: Response) => {
       try {
        const subscriberId: number = (request as any).user.userId;

        const appDataSource = await getDataSource();
        const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
        const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
        const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);

        if(!existingSubscriber) {
            console.error("Subscriber not found");
            response.status(CONFLICT).send(false);
            return;
        }

        const existingSubscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
            .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
            .where("subscriber.subscriberId = :subscriberId", { subscriberId })
            .andWhere("subscriberSocialMedia.socialMedia = :socialMedia", { socialMedia: socialMediaType.FACEBOOK })
            .getOne();
        if(existingSubscriberSocialMediaData && existingSubscriberSocialMediaData.userAccessToken) {
            response.status(SUCCESS_GET).send(true);
            return;
        } else {
            response.status(SUCCESS_GET).send(false);
            return;
        }
       } catch (error) {
        console.error("Error while check if the user is connected with facebook.");
        throw error;
       }
    }
}