import { authUtility } from "../../../utils/authUtility";
import { BAD_REQUEST, CONFLICT, SUCCESS_GET, validateEmail } from "../../../utils/common";
import { getDataSource } from "../../../utils/dataSource";
import { CustomError, Success } from "../../../utils/response";
import { subscribers } from "../dataModels/entities/subscriber.entity";
import { userRoles } from "../dataModels/enums/userRoles.enums";
import { SubscriberRegInputData } from "../dataModels/types/subscriber.type";
import { Request, Response } from "express";

export class subscriberService {
    _authUtility = new authUtility();
    subscriberRegistration = async (request: Request, response: Response) => {
        try {
            const { email, password, company, userName } = request.body as SubscriberRegInputData;
            
            if(!email || !password || !company || !userName) {
                response.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Please provide email and password"));
                return;
            }

            if (!(await validateEmail(email))) {
              console.error(`Invalid email`);
              response.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Invalid email"));
              return;
            }
            
            const appDatasourse = await getDataSource();
            const subscriberRepository = appDatasourse.getRepository(subscribers);
            const existingSubscribersWithSameEmail =await subscriberRepository.findOneBy({ email: email });
            if(existingSubscribersWithSameEmail) {
                response.status(CONFLICT).send(CustomError(CONFLICT, "Email already exists"));
                return;
            }
            const subscriber = new subscribers();
            subscriber.email = email;
            subscriber.company = company;
            subscriber.userName = userName;
            subscriber.password = await this._authUtility.hashPassword(password);;
            subscriber.userRole = userRoles.SUBSCRIBER;
            await subscriberRepository.save(subscriber);
            console.log("Subscriber registered successfully");
            response.status(SUCCESS_GET).send(Success("Subscriber registered successfully"));
            return;
        } catch (error) {
            console.error("Error while subscriber registration", error);
            return error;
        }
    }
}