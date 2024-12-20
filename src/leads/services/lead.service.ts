import { BAD_REQUEST, SUCCESS_GET } from "../../utils/common";
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
        }
    }

    fetchLeadData = async (req: Request, res: Response) => {
        try {
            const subcriberId = (req as any).user.userId;
            const { source, page, size } = (req as any).query as { source: string, page: number, size: number };
            if(!subcriberId) {
                console.error("User not authenticated!");
                res.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "User not authenticated!"));
            }

            const appDataSource = await getDataSource();
            const leadRepository = appDataSource.getRepository(Leads);
            const leadQueryBuilder = leadRepository.createQueryBuilder("lead")
                .where("lead.source =: source", {source: source})
                .orderBy("lead.createdAt", 'DESC');
            
            if(page && size) {
                leadQueryBuilder.skip((page - 1) * size).take(size)
            }

            const totalCount = await leadQueryBuilder.getCount();
            const data = await leadQueryBuilder.getMany();

            res.status(SUCCESS_GET).send(Success({metaData: { totalCount }, data}));
            return;  
        } catch (error) {
            console.error("Error while fetching lead", error);
        }
    }
}