import { admins } from "../users/admin/dataModels/entities/admin.entity";
import { userRoles } from "../users/subscriber/dataModels/enums/userRoles.enums";
import { authUtility } from "./authUtility";
import { getDataSource } from "./dataSource";

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