import { BAD_REQUEST, checkSubscriberExitenceUsingId, ERROR_COMMON_MESSAGE, EXTERNAL_WEBHOOK_ENDPOINT_URL, INTERNAL_ERROR, NOT_AUTHORIZED, NOT_FOUND, SUCCESS_GET, WEBHOOK_SHARED_SECRET } from "../../utils/common";
import { getDataSource } from "../../utils/dataSource";
import { CustomError, Success } from "../../utils/response";
import { sendLeadDataToWebhookEndpoint } from "../../utils/webhookUtility";
import { Leads } from "../dataModels/entities/lead.entity";
import { LeadData, SocialMediaLeadUpdateData } from "../dataModels/types/lead.type";
import { Request, Response } from "express";

export class LeadsService {
    // Utility functions for social media lead services
    createSubscribersLeads = async (data: LeadData, source: string) => {
        try {
            if(data) {
                const appDataSource = await getDataSource();
                const leadRepository = appDataSource.getRepository(Leads);

                const leadEnitity = new Leads();
                leadEnitity.leadText = data.leadText;
                leadEnitity.status = data.status;
                leadEnitity.contactName = data.contactName;
                leadEnitity.contactEmail = data.contactEmail;
                leadEnitity.contactPhone = data.contactPhone ?? '';
                leadEnitity.subscriberId = data.subscriberId;
                leadEnitity.source = source;

                const response = await leadRepository.save(leadEnitity);

                console.log("Lead data saved successfully!");
                return response;
            }
        } catch (error) {
            console.error("Error while adding lead data from soical medias", error);
            throw error;
        }
    }

    socialMediaLeadServiceValidations = async (req: Request, res: Response) => {
        try {
            const subcriberId = (req as any).user.userId;
            const id = (req as any).params.id;

            if(!subcriberId) {
                console.error("User not authenticated!");
                res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User not authenticated!"));
                return;
            }

            if(!id) {
                console.error("Social media lead id is missing!");
                res.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Social media lead id is missing!"));
                return;
            }

            const subscriber = await checkSubscriberExitenceUsingId(subcriberId);
            if(!subscriber) {
                console.error("User not found!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "User not found!"));
                return;
            }
            return;
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
            const subcriberId = (req as any).user.userId;
            const { source, page, size } = (req as any).query as { source: string, page: number, size: number };
            if(!subcriberId) {
                console.error("User not authenticated!");
                res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "User not authenticated!"));
                return;
            }

            const subscriber = await checkSubscriberExitenceUsingId(subcriberId);
            if(!subscriber) {
                console.error("User not found!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "User not found!"));
                return;
            }

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(Leads);
            const leadQueryBuilder = leadRepository.createQueryBuilder("lead")
                .where("lead.subscriberId = :subscriberId", {subcriberId})
                .orderBy("lead.createdAt", 'DESC');

            if(source) {
                leadQueryBuilder.where("lead.source = :source", {source: source})
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
            const subcriberId = (req as any).user.userId;
            const id = (req as any).params.id;
            
            // All neccessery validations
            await this.socialMediaLeadServiceValidations(req, res);

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(Leads);
            const leadData = await leadRepository.createQueryBuilder("lead")
                .where("lead.leadId = :id", {id})
                .andWhere("lead.subscriberId = :subscriberId", {subcriberId})
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
            const subcriberId = (req as any).user.userId;
            const id = (req as any).params.id;
            const {email, phone, text, remarks} = req.body as SocialMediaLeadUpdateData
            
            // All neccessery validations
            await this.socialMediaLeadServiceValidations(req, res);

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(Leads);
            const leadQueryBuilder = leadRepository.createQueryBuilder("lead");
            
            const leadData = await leadQueryBuilder
                .where("lead.leadId = :id", {id})
                .andWhere("lead.subscriberId = :subscriberId", {subcriberId})
                .getOne();
            if(!leadData) {
                console.error("No lead data is matching with this id!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "No lead data is matching with this id!"));
                return;
            }

            leadData.contactEmail = email ?? leadData.contactEmail;
            leadData.contactPhone = phone ?? leadData.contactPhone;
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
            const subcriberId = (req as any).user.userId;
            const id = (req as any).params.id;

            // All neccessery validations
            await this.socialMediaLeadServiceValidations(req, res);

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(Leads);
            const leadQueryBuilder = leadRepository.createQueryBuilder("lead");
            
            const leadData = await leadQueryBuilder
                .where("lead.leadId = :id", {id})
                .andWhere("lead.subscriberId = :subscriberId", {subcriberId})
                .getOne();
            if(!leadData) {
                console.error("No lead data is matching with this id!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "No lead data is matching with this id!"));
                return;
            }

            await leadQueryBuilder.delete()
                .where("lead.leadId = :id", {id})
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
            const subcriberId = (req as any).user.userId;
            const id = (req as any).params.id;

            // All neccessery validations
            await this.socialMediaLeadServiceValidations(req, res);

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(Leads);
            const leadQueryBuilder = leadRepository.createQueryBuilder("lead");
            
            const leadData = await leadQueryBuilder
                .where("lead.leadId = :id", {id})
                .andWhere("lead.subscriberId = :subscriberId", {subcriberId})
                .getOne();
            if(!leadData) {
                console.error("No lead data is matching with this id!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "No lead data is matching with this id!"));
                return;
            }

            if(!leadData.contactEmail || !leadData.contactPhone) {
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

            const result = await sendLeadDataToWebhookEndpoint(leadData, externalUrl, webhookSharedSecret);
            if(result.status) {
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