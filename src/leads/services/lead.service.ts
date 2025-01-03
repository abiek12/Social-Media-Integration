import { BAD_REQUEST, checkSubscriberExitenceUsingId, ERROR_COMMON_MESSAGE, EXTERNAL_WEBHOOK_ENDPOINT_URL, INTERNAL_ERROR, NOT_AUTHORIZED, NOT_FOUND, SUCCESS_GET, WEBHOOK_SHARED_SECRET } from "../../utils/common";
import { getDataSource } from "../../utils/dataSource";
import { CustomError, Success } from "../../utils/response";
import { sendLeadDataToWebhookEndpoint } from "../../utils/webhookUtility";
import { SocialMediaLeads } from "../dataModels/entities/socialMediaLeads.entity";
import { LeadData, SocialMediaLeadFilters, SocialMediaLeadUpdateData } from "../dataModels/types/lead.type";
import { Request, Response } from "express";

export class LeadsService {
    // Utility functions for social media lead services
    createSubscribersLeads = async (data: LeadData, source: string) => {
        try {
            if(data) {
                const subscriber = await checkSubscriberExitenceUsingId(data.subscriberId);
                if(subscriber) {
                    const appDataSource = await getDataSource();
                    const leadRepository = appDataSource.getRepository(SocialMediaLeads);

                    const leadEnitity = new SocialMediaLeads();
                    leadEnitity.leadText = data.leadText;
                    leadEnitity.status = data.status;
                    leadEnitity.contactName = data.contactName;
                    leadEnitity.contactEmail = data.contactEmail;
                    leadEnitity.contactPhone = data.contactPhone ?? '';
                    leadEnitity.subscriber = subscriber;
                    leadEnitity.source = source;
                    leadEnitity.remarks = ""

                    const response = await leadRepository.save(leadEnitity);

                    console.log("Lead data saved successfully!");
                    return response;
                }
            }
        } catch (error) {
            console.error("Error while adding lead data from soical medias", error);
            throw error;
        }
    }

    socialMediaLeadServiceValidations = async (req: Request, res: Response) => {
        try {
            const subscriberId = (req as any).user.userId;
            const id = (req as any).params.id;

            if(!subscriberId) {
                console.error("User not authenticated!");
                res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User not authenticated!"));
                return;
            }

            if(!id) {
                console.error("Social media lead id is missing!");
                res.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Social media lead id is missing!"));
                return;
            }

            const subscriber = await checkSubscriberExitenceUsingId(subscriberId);
            if(!subscriber) {
                console.error("User not found!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "User not found!"));
                return;
            }
        } catch (error) {
            console.error("Error while social media lead service validations", error);
            res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
            return;
        }
    }


    // --------------------------//

    // Fetch social media leads 
    fetchLeadData = async (req: Request, res: Response) => {
        try {
            const subscriberId = (req as any).user.userId;
            const { source, page, size, isConverted } = (req as any).query as SocialMediaLeadFilters;
            if(!subscriberId) {
                console.error("User not authenticated!");
                res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User not authenticated!"));
                return;
            }

            const subscriber = await checkSubscriberExitenceUsingId(subscriberId);
            if(!subscriber) {
                console.error("User not found!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "User not found!"));
                return;
            }

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(SocialMediaLeads);
            const leadQueryBuilder = leadRepository.createQueryBuilder("lead")
                .where("lead.subscriber_id =:subscriberId", {subscriberId})
                .orderBy("lead.createdAt", 'DESC');

            if(source) {
                leadQueryBuilder.andWhere("lead.source = :source", {source: source})
            }

            if(isConverted) {
                leadQueryBuilder.andWhere("lead.isConverted =:isConverted", {isConverted})
            }
            
            if(page && size) {
                leadQueryBuilder.skip((page - 1) * size).take(size)
            }

            const totalCount = await leadQueryBuilder.getCount();
            const data = await leadQueryBuilder.getMany();

            res.status(SUCCESS_GET).send(Success({totalCount, data}));
            return;  
        } catch (error) {
            console.error("Error while fetching social media leads", error);
            res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE));
            return;
        }
    }

    // Get social media lead by id
    getSocialMediaLeadById = async (req: Request, res: Response) => {
        try {
            const subscriberId = (req as any).user.userId;
            const id = (req as any).params.id;
            
            // All neccessery validations
            await this.socialMediaLeadServiceValidations(req, res);

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(SocialMediaLeads);
            const leadData = await leadRepository.createQueryBuilder("lead")
                .leftJoinAndSelect("lead.subscriber","subscriber")
                .where("lead.leadId =:id", {id})
                .andWhere("subscriber.subscriber_id =:subscriberId", {subscriberId})
                .select([
                    "lead.leadId",
                    "lead.leadText",
                    "lead.status",
                    "lead.source",
                    "lead.contactPhone",
                    "lead.contactName",
                    "lead.contactEmail",
                    "lead.contactEmail",
                    "lead.remarks",
                    "lead.isConverted",
                    "lead.createdAt",
                    "lead.updatedAt"
                ])
                .getOne();
            if(!leadData) {
                console.error("No lead data is matching with this id!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "No lead data is matching with this id!"));
                return;
            }

            console.log(`Lead data with ${id} fetched successfully!`);
            res.status(SUCCESS_GET).send(Success(leadData));
            return;
        } catch (error) {
            console.error("Error while fetching social media leads by id", error);
            res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE))
            return;
        }
    }

    // Update
    updateSocialMediaLead = async (req: Request ,res: Response) => {
        try {
            const subscriberId = (req as any).user.userId;
            const id = (req as any).params.id;
            const {name, email, phone, text, remarks} = req.body as SocialMediaLeadUpdateData
            
            // All neccessery validations
            await this.socialMediaLeadServiceValidations(req, res);

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(SocialMediaLeads);
            const leadQueryBuilder = leadRepository.createQueryBuilder("lead");
            
            const leadData = await leadQueryBuilder
                .leftJoinAndSelect("lead.subscriber","subscriber")
                .where("lead.leadId =:id", {id})
                .andWhere("subscriber.subscriber_id =:subscriberId", {subscriberId})
                .getOne();
            if(!leadData) {
                console.error("No lead data is matching with this id!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "No lead data is matching with this id!"));
                return;
            }

            leadData.contactName = name ?? leadData.contactName;
            leadData.contactEmail = email ?? leadData.contactEmail;
            leadData.contactPhone = phone ?? leadData.contactPhone;
            leadData.remarks = remarks ?? leadData.remarks;
            leadData.leadText = text ?? leadData.leadText;
            await leadRepository.save(leadData);

            console.log("Social media lead updated successfully!");
            res.status(SUCCESS_GET).send(Success("Social media lead updated successfully!"))
            return;
        } catch (error) {
            console.error("Error while updating social media lead", error);
            res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE))
            return;
        }
    }

    // Delete
    deleteSocialMediaLead = async (req: Request, res: Response) => {
        try {
            const subscriberId = (req as any).user.userId;
            const id = (req as any).params.id;

            // All neccessery validations
            await this.socialMediaLeadServiceValidations(req, res);

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(SocialMediaLeads);
            
            const leadData = await leadRepository.createQueryBuilder("lead")
                .leftJoinAndSelect("lead.subscriber","subscriber")
                .where("lead.leadId =:id", {id})
                .andWhere("subscriber.subscriber_id =:subscriberId", {subscriberId})
                .getOne();
            if(!leadData) {
                console.error("No lead data is matching with this id!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "No lead data is matching with this id!"));
                return;
            }

            await leadRepository.createQueryBuilder()
                .delete()
                .where("leadId = :id", {id})
                .execute();
            console.log("Social media lead deleted successfully!");
            res.status(SUCCESS_GET).send(Success("Social media lead deleted successfully!"))
            return;
        } catch (error) {
            console.error("Error while deleting social media lead", error);
            res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE))
            return;
        }
    }

    // Convert to lead
    convertToLead = async (req: Request, res: Response) => {
        try {
            const subscriberId = (req as any).user.userId;
            const id = (req as any).params.id;

            // All neccessery validations
            await this.socialMediaLeadServiceValidations(req, res);

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(SocialMediaLeads);
            const leadQueryBuilder = leadRepository.createQueryBuilder("lead");
            
            const leadData = await leadQueryBuilder
                .leftJoinAndSelect("lead.subscriber","subscriber")
                .where("lead.leadId =:id", {id})
                .andWhere("subscriber.subscriber_id =:subscriberId", {subscriberId})
                .getOne();
            if(!leadData) {
                console.error("No lead data is matching with this id!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "No lead data is matching with this id!"));
                return;
            }

            if(!leadData.contactEmail && !leadData.contactPhone) {
                console.error("Either contact phone or email require to convert to lead!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "Either contact phone or email require to convert to lead!"));
                return;
            }

            const externalUrl = EXTERNAL_WEBHOOK_ENDPOINT_URL;
            const webhookSharedSecret = WEBHOOK_SHARED_SECRET;

            if(!externalUrl) {
                console.error("Webhook endpoint url is missing!");
                throw new Error("Webhook endpoint url is missing!");
            }
            if(!webhookSharedSecret) {
                console.error("Webhook shared secret missing!");
                throw new Error("Webhook shared secret missing!");
            }

            const payload = {
                leadText: leadData.leadText,
                contactEmail: leadData.contactEmail,
                contactName: leadData.contactName,
                contactPhone: leadData.contactPhone,
                source: leadData.source,
                subscriberId: subscriberId,
                remarks: leadData.remarks,
                clientName: leadData.contactName
            }

            const result = await sendLeadDataToWebhookEndpoint(payload, externalUrl, webhookSharedSecret);
            if(result.status) {
                leadData.isConverted = true;
                await leadRepository.save(leadData);

                console.log("Successfully send webhook data and Converted into lead!");
                res.status(SUCCESS_GET).send(Success("Successfully send webhook data and Converted into lead!"));
                return;
            } else {
                console.log(result);
                res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, "Failed to send webhook data! Please try again."));
                return;
            }

        } catch (error) {
            console.error("Error while converting social media lead", error);
            res.status(INTERNAL_ERROR).send(CustomError(INTERNAL_ERROR, ERROR_COMMON_MESSAGE))
            return;
        }
    }

}