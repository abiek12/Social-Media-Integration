import { BAD_REQUEST, CONFLICT, SUCCESS_GET } from "../../../utils/common";
import { getDataSource } from "../../../utils/dataSource";
import { subscribers } from "../dataModels/entities/subscriber.entity";
import { SubscriberRegInputData } from "../dataModels/types/subscriber.type";
import { Request, Response } from "express";

export class subscriberService {
    subscriberRegistration = async (request: Request, response: Response): Promise<any> => {
        try {
            const { email, password, company, userName } = request.body as SubscriberRegInputData;
            if(!email || !password || !company || !userName) {
                response.status(BAD_REQUEST).send("Please provide email and password");
                return;
            }
            const appDatasourse = await getDataSource();
            const subscriberRepository = appDatasourse.getRepository(subscribers);
            const existingSubscribersWithSameEmail =await subscriberRepository.findOneBy({ email: email, isDeleted: false });
            if(existingSubscribersWithSameEmail) {
                response.status(CONFLICT).send("Email already exists");
                return;
            }
            const subscriber = new subscribers();
            subscriber.email = email;
            subscriber.company = company;
            subscriber.userName = userName;
            subscriber.password = password;
            await subscriberRepository.save(subscriber);
            response.status(SUCCESS_GET).send("Subscriber registered successfully");
            return;
        } catch (error) {
            console.error("Error while subscriber registration", error);
            return error;
        }
    }
}