import { Request, Response } from "express";
import { BAD_REQUEST, generateTokens, SUCCESS_GET, validateEmail } from "../../../utils/common";
import { getDataSource } from "../../../utils/dataSource";
import { userRoles } from "../../subscriber/dataModels/enums/userRoles.enums";
import { admins } from "../../admin/dataModels/entities/admin.entity";
import { subscribers } from "../../subscriber/dataModels/entities/subscriber.entity";
import { CustomError, Success } from "../../../utils/response";
import { authUtility } from "../../../utils/authUtility";

export class AuthService {
    private _authUtility = new authUtility();
    userLogin = async (request: Request, response: Response) => {
        try {
            const { email, password, role } = request.body as { email: string, password: string, role: string };
            if (!email || !password) {
                response.status(BAD_REQUEST).send("Please provide email and password");
                return;
            }

            if (!(await validateEmail(email))) {
              console.error(`Invalid email`);
              response.status(BAD_REQUEST).send("Invalid email");
              return;
            }

            let userRepository: any;
            let userQueryBuilder: any;
            const appDatasourse = await getDataSource();

            switch (role) {
              case userRoles.SUBSCRIBER:
                userRepository = appDatasourse.getRepository(subscribers);
                userQueryBuilder = userRepository.createQueryBuilder("user");
                break;
              case userRoles.ADMIN:
              case userRoles.SUPERADMIN:
                userRepository = appDatasourse.getRepository(admins);
                userQueryBuilder = userRepository.createQueryBuilder("user");
                break;
              default:
               response.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Invalid role"));
               return;
            }

            const user = await userQueryBuilder.getOne();
            if (!user) {
              console.error(`User not found`);
              response.status(BAD_REQUEST).send("User not found");
              return;
            }

            const passwordComparison = await this._authUtility.comparePassword( password, user.password );
            if (!passwordComparison) {
              console.error(`Invalid password`);
              response.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Invalid password"));
              return;
            }

            let userid;
            switch (role) {
              case userRoles.SUBSCRIBER:
                userid = user.subscriberId;
              default:
                userid = user.user_id;
                break;
            }

            let loginResponse = await generateTokens(user.userRole, user.subscriberId ? user.subscriberId : userid);
            response.status(SUCCESS_GET).send(Success(loginResponse));
        } catch (error) {
            console.error("Error while user login", error);
            throw error;
        }
    }
}