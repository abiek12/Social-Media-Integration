import { admins } from "../users/admin/dataModels/entities/admin.entity";
import { userRoles } from "../users/subscriber/dataModels/enums/userRoles.enums";
import { authUtility } from "./authUtility";
import { getDataSource } from "./dataSource";

export const BAD_REQUEST = 400;
export const CONFLICT = 409;
export const SUCCESS_CREATE = 201;
export const SUCCESS_GET = 200;
export const NOT_FOUND = 404;
export const FORBIDDEN = 403;
export const NOT_AUTHORIZED = 401;
export const INTERNAL_ERROR = 500;
export const NOT_ACCEPTABLE = 406;
export const REDIRECT = 302;
export const ERROR_COMMON_MESSAGE = "Internal Server Error";

export const lockoutCount = 5;
export const lockoutTime = 120; // 7days
export const TOKEN_EXPIRY = 360000;
export const REFRESH_TOKEN_EXPIRY = 86400000;
export const ACTIVATION_KEY_EXPIRY_DAYS = 1;
export const OTP_EXPIRY_TIME = 10;

export const createAdminUser = async (data?: any) => {
    const _authUtility = new authUtility();
    console.log("createAdminUser");
    try {
      if (!process.env.adminEmail || !process.env.adminPassword) {
        console.log(`Admin email or password not found`);
        return false;
      }
      const appDatasourse = await getDataSource();
      const userRepository = appDatasourse.getRepository(admins);
      const exitingUser = await userRepository.findOneBy({
        email: process.env.adminEmail,
      });
      if (exitingUser) {
        console.log(`Admin user already exists`);
        return false;
      }
      const user = new admins();
      user.email = process.env.adminEmail;
      user.password = await _authUtility.hashPassword(process.env.adminPassword);
      user.userName = process.env.adminUserName || "admin";
      user.userRole = userRoles.SUPERADMIN;
      user.emailVarified = true;
      user.approved = true;
      await userRepository.save(user);
      console.log(`Admin user created successfully`);
      return true;
    } catch (error) {
      console.log(`Failed to create admin user: ${error}`);
      return false;
    }
  };