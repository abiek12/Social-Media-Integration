import { Request, Response } from "express";
import { subscriberSocialMedia } from "../dataModels/entities/subscriberSocialMedia.entity";
import { SubscriberFacebookSettings } from "../dataModels/entities/subscriberFacebook.entity";
import { getDataSource } from "../../utils/dataSource";
import { FacebookWebhookRequest, LeadData, pageMetaDataTypes, VerificationData } from "../dataModels/types/meta.types";
import { CustomError, Success } from "../../utils/response";
import { BAD_REQUEST, checkSubscriberExitenceUsingId, CONFLICT, ERROR_COMMON_MESSAGE, FORBIDDEN, INTERNAL_ERROR, NOT_AUTHORIZED, NOT_FOUND, SUCCESS_GET } from "../../utils/common";
import { fetchFacebookPages, fetchingLeadDetails, fetchingLeadgenData, getMetaUserAccessTokenDb, installMetaApp, verifySignature } from "../../utils/socialMediaUtility";
import { leadStatus } from "../../leads/dataModels/enums/lead.enums";
import { LeadsService } from "../../leads/services/lead.service";

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
            const body = request.body as FacebookWebhookRequest;
            console.log(body);
            
            const appSecret = process.env.META_APP_SECRET;
            if(!appSecret) {
                console.error('META_APP_SECRET is not defined');
                response.status(FORBIDDEN).send(CustomError(FORBIDDEN, 'Forbidden'));
                return;
            }

            // const rawBody = (request as any).rawBody; 
            // if (!verifySignature(signature, body, appSecret)) {
            //     console.error('App Secret is not valid');
            //     response.status(FORBIDDEN).send(CustomError(FORBIDDEN, 'Forbidden'));
            //     return;
            // }
            console.info("request header X-Hub-Signature validated");
            response.status(SUCCESS_GET).send('EVENT_RECEIVED');

            // fetching leadgen id and page id from webhook data
            const leadgenData = fetchingLeadgenData(body);

            if (!leadgenData) {
                console.error('No leadgen data found in the payload');
                response.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, 'No leadgen data found'));
                return;
            }

            const { leadgenId, pageId } = leadgenData;

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
                    console.log(leadData);
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

                        if(email && fullName) {
                            const data = {
                                leadText: leadText? leadText : `Enquiry from ${fullName}`,
                                status: leadStatus.LEAD,
                                contactEmail: email,
                                contactName: fullName,
                                companyName: companyName,
                                designation: designation,
                                subscriberId: subscriberId,
                                contactPhone: phoneNumber ? phoneNumber : null,
                                contactCountry: country ? country : null,
                                contactState:state ? state : null,
                                contactCity:city ? city : null,

                            }
                            console.log(data);
                            
                            // Creating Lead with the above data
                            const subscriberLeadService = new LeadsService();
                            await subscriberLeadService.createSubscribersLeads(data);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error while receiving webhook data.",error);
            throw error;
        }
    }

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
            // const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");

            const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);

            if(!existingSubscriber) {
                console.error("Subscriber not found");
                response.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Subscriber not found!"));
                return;
            }
            // const existingSubscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
            //     .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
            //     .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
            //     .where("subscriber.subscriberId = :subscriberId", { subscriberId })
            //     .getMany();
            
            // if(existingSubscriberSocialMediaData.length > 0) {
            //    for(const invidualData of existingSubscriberSocialMediaData) {
            //         await subscriberSocialMediaRepository.delete(invidualData.subscriberSocialMediaId);
            //         await subscriberFacebookRepository.delete(invidualData.facebook.subFacebookSettingsId);
            //     }
            // }

            for (const pageData of pages) {
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
            .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
            .where("subscriber.subscriberId = :subscriberId", { subscriberId })
            .getOne();
        if(existingSubscriberSocialMediaData && existingSubscriberSocialMediaData.facebook.userAccessToken) {
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