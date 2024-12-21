import { BAD_REQUEST, checkSubscriberExitenceUsingId, ERROR_COMMON_MESSAGE, INTERNAL_ERROR, NOT_AUTHORIZED, NOT_FOUND, SUCCESS_GET } from "../../utils/common";
import { getDataSource } from "../../utils/dataSource";
import { CustomError, Success } from "../../utils/response";
import { Leads } from "../dataModels/entities/lead.entity";
import { LeadData } from "../dataModels/types/lead.type";
import { Request, Response } from "express";

export class LeadsService {
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
            if(subscriber) {
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
            const id = (req as any).query.id;
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
            if(subscriber) {
                console.error("User not found!");
                res.status(NOT_FOUND).send(CustomError(NOT_FOUND, "User not found!"));
                return;
            }

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
}