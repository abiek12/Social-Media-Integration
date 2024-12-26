import { Request, Response } from "express";
import { subscriberSocialMedia } from "../dataModels/entities/subscriberSocialMedia.entity";
import { SubscriberFacebookSettings } from "../dataModels/entities/subscriberFacebook.entity";
import { getDataSource } from "../../utils/dataSource";
import { pageMetaDataTypes, VerificationData } from "../dataModels/types/meta.types";
import { CustomError, Success } from "../../utils/response";
import { BAD_REQUEST, checkSubscriberExitenceUsingId, CONFLICT, ERROR_COMMON_MESSAGE, FORBIDDEN, INTERNAL_ERROR, NOT_AUTHORIZED, NOT_FOUND, SUCCESS_GET } from "../../utils/common";
import { fetchFacebookPages, getMetaUserAccessTokenDb, installMetaApp, verifySignature } from "../../utils/socialMediaUtility";
import { socialMediaType } from "../dataModels/enums/socialMedia.enums";
import { leadSource } from "../../leads/dataModels/enums/lead.enums";
import { handleLeadgenEvent, handleMessagingEvent } from "../../utils/webhookUtility";

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
            const signature = request.headers['x-hub-signature-256'] as string;
            const rawBody = (request as any).rawBody;
            const body = request.body;
            console.log("Body:",body);

            if (!signature || !signature.startsWith('sha256=')) {
                console.error('X-Hub-Signature-256 is not in request header');
                response.status(FORBIDDEN).send(CustomError(FORBIDDEN, 'X-Hub-Signature-256 is not in request header'));
                return;
            }
            
            const appSecret = process.env.META_APP_SECRET;
            if (!appSecret) {
                console.error('META_APP_SECRET is not defined');
                response.status(FORBIDDEN).send(CustomError(FORBIDDEN, 'META_APP_SECRET is not defined'));
                return;
            }
        
            // Validate Signature
            if (!verifySignature(signature, rawBody, appSecret)) {
                console.error('Invalid signature');
                response.status(FORBIDDEN).send(CustomError(FORBIDDEN, 'Invalid signature'));
                return;
            }
        
            console.info("Request header X-Hub-Signature validated");
            console.log("Event Received");
            // Acknowledge the webhook event
            response.status(SUCCESS_GET).send('EVENT_RECEIVED');
        
            // Process Page Events
            if(body.object === 'page') {
                const { entry } = body;
                for(const pageEntry of entry) {
                    let fields;
                    // Determine the event type
                    if (pageEntry?.changes?.[0]?.field === 'leadgen') {
                        fields = 'leadgen';
                    } else if (pageEntry?.messaging) {
                        fields = 'messages';
                    }

                    switch(fields) {
                        case "leadgen":
                            for (const change of pageEntry.changes || []) {
                                if (change.field === 'leadgen') {
                                    console.log("Leadgen Event Received");
                                    console.log(change);
                                    await handleLeadgenEvent(change);
                                }
                            }
                            break;
                        case "messages":
                            for(const message of pageEntry.messaging || []) {
                                console.log("Messaging Event Received");
                                console.log(message);
                                const source = leadSource.FACEBOOK;
                                await handleMessagingEvent(message, source);
                            }
                            break;
                        default:
                            console.warn(`Unhandled event field: ${fields}`);
                            break;
                    }

                }
            }

            // Process Instagram Events
            if(body.object === 'instagram') {
                const { entry } = body;
                for(const pageEntry of entry) {
                    let fields;
                    // Determine the event type
                    if (pageEntry?.changes?.[0]?.field === 'comments') {
                        fields = 'comments';
                    } else if (pageEntry?.messaging) {
                        fields = 'messages';
                    }

                    switch(fields) {
                        case "comments":
                            for (const change of pageEntry.changes || []) {
                                if (change.field === 'comments') {
                                    console.log("Comments Event Received");
                                    console.log(change);
                                }
                            }
                            break;
                        case "messages":
                            for(const message of pageEntry.messaging || []) {
                                console.log("Messaging Event Received");
                                console.log(message);
                                const source = leadSource.INSTAGRAM;
                                await handleMessagingEvent(message, source);
                            }
                            break;
                        default:
                            console.warn(`Unhandled event field: ${fields}`);
                            break;
                    }
                }
            }

            // Process Whatsapp Events
            if(body.object === 'whatsapp_business_account') {
                const { entry } = body;
                for(const pageEntry of entry) {
                    let fields;
                    // Determine the event type
                    if (pageEntry?.changes?.[0]?.field === 'messages') {
                        fields = 'messages';
                    }

                    switch(fields) {
                        case "messages":
                            for(const message of pageEntry.messaging || []) {
                                console.log("Messaging Event Received");
                                console.log(message);
                            }
                            break;
                        default:
                            console.warn(`Unhandled event field: ${fields}`);
                            break;
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
            if(!subscriberId) {
              console.error("User id not found");
              response.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
              return;
            }

            const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);
            if(!existingSubscriber) {
              console.error("User not found");
              response.status(NOT_FOUND).send(CustomError(NOT_FOUND, "User not found!"));
              return;
            }

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
            const pages = request.body as pageMetaDataTypes[]
            if(pages.length === 0 ) {
                console.error("Page data not found");
                response.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Page data not found!"));
                return;
            }
            if(!subscriberId) {
              console.error("User id not found");
              response.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
              return;
            }

            const appDataSource = await getDataSource();
            const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
            const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
            const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
            const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");

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

            console.log("Existing Social Media Data:", {
                id: existingSubscriberSocialMediaData.subscriberSocialMediaId,
                subscriberId: subscriberId
            });

            for (const pageData of pages) {
                if(!pageData.accessToken || !pageData.id || !pageData.name) {
                    console.error("Access token, page id or page name is missing!");
                    response.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Access token, page id or page name is missing!"));
                    return;
                }
                const pageExistance = await subscriberFacebookQueryBuilder
                    .leftJoinAndSelect("subscriberFacebook.subscriber", "subscriber")
                    .where("subscriberFacebook.pageId = :pageId", {pageId: pageData.id})
                    .andWhere("subscriber.subscriberId = :subscriberId", {subscriberId})
                    .getOne();
                if(pageExistance) {
                    console.error(`Page:'${pageData.name}' with page id:'${pageData.id}' already exists!`)
                    response.status(CONFLICT).send(CustomError(CONFLICT, `Page:'${pageData.name}' with page id:'${pageData.id}' already exists!`))
                    return;
                }
                const subscriberFacebookEntity = new SubscriberFacebookSettings();
                subscriberFacebookEntity.pageId = pageData.id;
                subscriberFacebookEntity.pageAccessToken = pageData.accessToken;
                subscriberFacebookEntity.pageName = pageData.name;
                subscriberFacebookEntity.pageTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
                subscriberFacebookEntity.subscriberSocialMedia = existingSubscriberSocialMediaData;
                subscriberFacebookEntity.subscriber = existingSubscriber;

                console.log("Facebook Entity Before Save:", {
                    socialMediaId: subscriberFacebookEntity.subscriberSocialMedia?.subscriberSocialMediaId,
                    subscriberId: subscriberFacebookEntity.subscriber?.subscriberId,
                    pageId: subscriberFacebookEntity.pageId
                });

                await subscriberFacebookRepository.save(subscriberFacebookEntity);

                console.log("Query:", subscriberFacebookRepository.createQueryBuilder()
                .insert()
                .into(SubscriberFacebookSettings)
                .getQuery());
            }

            // Installing meta app on the subscriber's facebook pages
            await installMetaApp(subscriberId);

            console.info("Pages added successfully");
            response.status(SUCCESS_GET).send(Success("Pages added successfully!"));
            return;
        } catch (error) {
            console.error("Error selecting facebook pages", error);
            response.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
            return;
        }
    }
    
    // Handler for checking facebook status
    checkFacebookStatus = async (request: Request, response: Response) => {
       try {
        const subscriberId: number = (request as any).user.userId;
        if(!subscriberId) {
          console.error("User id not found");
          response.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
          return;
        }

        const appDataSource = await getDataSource();
        const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
        const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
        const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);

        if(!existingSubscriber) {
            console.error("User not found");
            response.status(CONFLICT).send(CustomError(CONFLICT, "User not found!"));
            return;
        }

        const existingSubscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
            .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
            .where("subscriber.subscriberId = :subscriberId", { subscriberId })
            .andWhere("subscriberSocialMedia.socialMedia = :socialMedia", { socialMedia: socialMediaType.FACEBOOK })
            .getOne();
        if(existingSubscriberSocialMediaData && existingSubscriberSocialMediaData.userAccessToken) {
            response.status(SUCCESS_GET).send(Success({facebookConfig: true}));
            return;
        } else {
            response.status(SUCCESS_GET).send(Success({facebookConfig: false}));
            return;
        }
       } catch (error) {
        console.error("Error while check if the user is connected with facebook.", error);
        response.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
        return;
       }
    }

    // get selected facebook pages
    getSelectedPages = async(request: Request, response: Response)=> {
        try {
            const subscriberId: number = (request as any).user.userId;
            if(!subscriberId) {
              console.error("User id not found");
              response.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
              return;
            }

            const appDataSource = await getDataSource();
            const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
            const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
            const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
            const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");

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

            const subscribersFacebookPages = await subscriberFacebookQueryBuilder
                .leftJoinAndSelect("subscriberFacebook.subscriber", "subscriber")
                .where("subscriber.subscriberId = :subscriberId", {subscriberId})
                .select([
                    "subscriberFacebook.subFacebookSettingsId",
                    "subscriberFacebook.pageId",
                    "subscriberFacebook.pageName",
                    "subscriberFacebook.pageAccessToken",
                    "subscriber.subscriberId",
                    "subscriber.userName"
                ])
                .getMany();

            console.log("User selected facebook pages fetched successfully!");
            response.status(SUCCESS_GET).send(Success(subscribersFacebookPages))
        } catch (error) {
            console.error("Error while fetching selected facebook pages.", error);
            response.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
            return;
        }
    }


    // update selected facebook pages
    updatePages = async (request: Request, response: Response) => {
        try {
            const subscriberId: number = (request as any).user.userId;
            const pages = request.body as pageMetaDataTypes[];
            if(!subscriberId) {
              console.error("User id not found");
              response.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
              return;
            }

            const appDataSource = await getDataSource();
            const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
            const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
            const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
            const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");

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

            await subscriberFacebookQueryBuilder
                .leftJoinAndSelect("subscriberFacebook.subscriber", "subscriber")
                .delete()
                .where("subscriber.subscriberId = :subscriberId", {subscriberId})
                .execute();

            if(pages.length > 0) {
                for (const pageData of pages) {
                    const pageExistance = await subscriberFacebookQueryBuilder
                        .where("subscriberFacebook.pageId = :pageId", {pageId: pageData.id})
                        .andWhere("subscriber.subscriberId = :subscriberId", {subscriberId})
                        .getOne();
                    if(!pageExistance) {
                        const subscriberFacebookEntity = new SubscriberFacebookSettings();
                        subscriberFacebookEntity.pageId = pageData.id;
                        subscriberFacebookEntity.pageAccessToken = pageData.accessToken;
                        subscriberFacebookEntity.pageName = pageData.name;
                        subscriberFacebookEntity.pageTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
                        subscriberFacebookEntity.subscriberSocialMedia = existingSubscriberSocialMediaData;
                        subscriberFacebookEntity.subscriber = existingSubscriber;
                        await subscriberFacebookRepository.save(subscriberFacebookEntity);
                    }
                }
    
                // Installing meta app on the subscriber's facebook pages
                await installMetaApp(subscriberId);
            }

            console.log("User selected facebook pages updated successfully!");
            response.status(SUCCESS_GET).send(Success("User selected facebook pages updated successfully!"))
            return;
        } catch (error) {
            console.error("Error while updating selected facebook pages.",error);
            response.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
            return;
        }
    }


    // Delete facebook configuration
    unlinkFacebook = async (request: Request, response: Response) => {
        try {
            const subscriberId: number = (request as any).user.userId;
            if(!subscriberId) {
              console.error("User id not found");
              response.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User id not found"));
              return;
            }

            const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);
            if(!existingSubscriber) {
                console.error("Subscriber not found");
                response.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber not found!"));
                return;
            }

            const appDataSource = await getDataSource();
            const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
            const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
            const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");

            const existingSubscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
                .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
                .andWhere("subscriberSocialMedia.socialMedia = :socialMedia", { socialMedia: socialMediaType.FACEBOOK })
                .where("subscriber.subscriberId = :subscriberId", { subscriberId })
                .getOne();
            if(!existingSubscriberSocialMediaData) {
                console.error("Subscriber Facebook configuration not found");
                response.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber Facebook configuration not found"));
                return;
            }

            const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");
            const existingFacebookData = await subscriberFacebookQueryBuilder
                .leftJoinAndSelect("subscriberFacebook.subscriber", "subscriber")
                .where("subscriber.subscriberId = :subscriberId", {subscriberId})
                .getMany();

            if(existingFacebookData.length > 0) {
                await subscriberFacebookQueryBuilder
                    .leftJoinAndSelect("subscriberFacebook.subscriber", "subscriber")
                    .delete()
                    .where("subscriber.subscriberId = :subscriberId", {subscriberId})
                    .execute();
                console.log("Selected facebook pages deleted successfully!");
            }

            await subscriberSocialMediaQueryBuilder
                .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
                .delete()
                .where("subscriber.subscriberId = :subscriberId", {subscriberId})
                .andWhere("subscriberSocialMedia.socialMedia = :socialMedia", {socialMedia: socialMediaType.FACEBOOK})
                .execute();

            console.log("Facebook configuration deleted successfully!");
            response.status(SUCCESS_GET).send(Success("Facebook configuration deleted successfully!"));
            return;

        } catch (error) {
            console.error("Error while unlinking facebook configuration",error);
            response.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
            return;
        }
    }

}