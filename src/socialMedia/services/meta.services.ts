import { Request, Response } from "express";
import { subscriberSocialMedia } from "../dataModels/entities/subscriberSocialMedia.entity";
import { SubscriberFacebookSettings } from "../dataModels/entities/subscriberFacebook.entity";
import { getDataSource } from "../../utils/dataSource";
import { FacebookWebhookRequest, LeadData, pageMetaDataTypes, VerificationData } from "../dataModels/types/meta.types";
import { CustomError, Success } from "../../utils/response";
import { BAD_REQUEST, checkSubscriberExitenceUsingId, ERROR_COMMON_MESSAGE, FORBIDDEN, INTERNAL_ERROR, NOT_AUTHORIZED, NOT_FOUND, SUCCESS_GET } from "../../utils/common";
import { fetchFacebookPages, fetchingLeadDetails, fetchingLeadgenData, getMetaUserAccessTokenDb, installMetaApp, verifySignature } from "../../utils/socialMediaUtility";

export class metaServices {
    // Meta Webhook Verification Endpoint
    verifyWebhook = async (request: Request, response: Response) => {
        const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query as VerificationData;
        if (mode === 'subscribe' && token === process.env.META_APP_VERIFY_TOKEN) {
            response.send(challenge);
            return
        }
        response.status(FORBIDDEN).send('Forbidden');
    }

    // Meta Webhook Event Notification Endpoint
    handleWebhook = async (request: Request, response: Response) => {
        const signature = request.headers['x-hub-signature'] as string | undefined;
        const body = request.body as FacebookWebhookRequest;

        const appSecret = process.env.META_APP_SECRET;

        if(appSecret) {
            if (!verifySignature(signature, body, appSecret)) {
               response.status(FORBIDDEN).send('Forbidden');
               return;
            }
        } else{
            console.error('META_APP_SECRET is not defined');
            response.status(FORBIDDEN).send('Forbidden');
            return;
        }

       console.info("request header X-Hub-Signature validated");
       response.status(SUCCESS_GET).send('EVENT_RECEIVED');

       // fetching leadgen id and page id from webhook data
       const {leadgenId, pageId}  = fetchingLeadgenData(body);

       if (leadgenId && pageId) {
           const appDataSource = await getDataSource();
           const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
           const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");

           const subscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
                .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
                .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
                .where("facebook.pageId = :pageId", { pageId })
                .getOne();
            
            if (subscriberSocialMediaData) {
                const subscriberId = subscriberSocialMediaData.subscriber.subscriberId;
                const pageAccessToken = subscriberSocialMediaData.facebook.pageAccessToken;
                // fetching actual lead data with page access token and leadgen id using meta graph api
                const leadData: LeadData = await fetchingLeadDetails(pageAccessToken, leadgenId);

                if (leadData) {
                    let email = null;
                    let fullName = null;
                    let phoneNumber = null;
                    let country = null;
                    let state = null;
                    let city = null;
                    let leadText = null;
                    let companyName = null;
                    let designation = null;
                    for await( let lead of leadData.field_data ) {
                        for await (let value of lead.values) {
                            switch (lead.name) {
                                case "email":
                                    email = value;
                                    break;
                                case "full_name":
                                    fullName = value;
                                    break;
                                case "phone":
                                    phoneNumber = value;
                                    break;
                                case "country":
                                    country = value;
                                    break;
                                case "state":
                                    state = value;
                                    break;
                                case "city":
                                    city = value;
                                    break;
                                case "leadText":
                                    leadText = value;
                                    break;
                                case "company_name":
                                    companyName = value;
                                    break;
                                case "job_title":
                                    designation = value;
                                    break;
                                default:
                                    break;
                            }
                        }                        
                    }

                    console.log(leadData);
                }
            }
        }
       
    }

    // Fetch facebook pages of the subscriber.
    fetchPages = async (request: Request, response: Response) => {
        try {
            const subscriberId: number = (request as any).user.subscriberId;
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
            const subscriberId: number = (request as any).user.subscriberId;
            const pageDatas = request.body as pageMetaDataTypes[];

            if(!pageDatas) {
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
                .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
                .where("subscriber.subscriberId = :subscriberId", { subscriberId })
                .getMany();
            
            if(existingSubscriberSocialMediaData.length > 0) {
               for(const invidualData of existingSubscriberSocialMediaData) {
                await subscriberFacebookRepository.delete(invidualData.facebook.subFacebookSettingsId);
                await subscriberSocialMediaRepository.delete(invidualData.subscriberSocialMediaId);
               }
            }

            for (const pageData of pageDatas) {
                const subscriberFacebookEntity = new SubscriberFacebookSettings();
                subscriberFacebookEntity.pageId = pageData.id;
                subscriberFacebookEntity.pageAccessToken = pageData.access_token;
                subscriberFacebookEntity.pageName = pageData.name;
                subscriberFacebookEntity.pageTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
                const facebookEntityResponse = await subscriberFacebookRepository.save(subscriberFacebookEntity);

                const subscriberSocialMediaEntity = new subscriberSocialMedia();
                subscriberSocialMediaEntity.facebook = facebookEntityResponse;
                subscriberSocialMediaEntity.subscriber = existingSubscriber;
                await subscriberSocialMediaRepository.save(subscriberSocialMediaEntity);
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
}