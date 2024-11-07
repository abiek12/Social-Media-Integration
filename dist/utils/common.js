"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminUser = void 0;
const admin_entity_1 = require("../users/admin/dataModels/entities/admin.entity");
const userRoles_enums_1 = require("../users/subscriber/dataModels/enums/userRoles.enums");
const authUtility_1 = require("./authUtility");
const dataSource_1 = require("./dataSource");
const createAdminUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const _authUtility = new authUtility_1.authUtility();
    console.log("createAdminUser");
    try {
        if (!process.env.adminEmail || !process.env.adminPassword) {
            console.log(`Admin email or password not found`);
            return false;
        }
        const appDatasourse = yield (0, dataSource_1.getDataSource)();
        const userRepository = appDatasourse.getRepository(admin_entity_1.admins);
        const exitingUser = yield userRepository.findOneBy({
            email: process.env.adminEmail,
        });
        if (exitingUser) {
            console.log(`Admin user already exists`);
            return false;
        }
        const user = new admin_entity_1.admins();
        user.email = process.env.adminEmail;
        user.password = yield _authUtility.hashPassword(process.env.adminPassword);
        user.userName = process.env.adminUserName || "admin";
        user.userRole = userRoles_enums_1.userRoles.SUPERADMIN;
        user.emailVarified = true;
        user.approved = true;
        yield userRepository.save(user);
        console.log(`Admin user created successfully`);
        return true;
    }
    catch (error) {
        console.log(`Failed to create admin user: ${error}`);
        return false;
    }
});
exports.createAdminUser = createAdminUser;
