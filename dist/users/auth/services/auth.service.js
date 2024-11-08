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
exports.AuthService = void 0;
const common_1 = require("../../../utils/common");
const dataSource_1 = require("../../../utils/dataSource");
const userRoles_enums_1 = require("../../subscriber/dataModels/enums/userRoles.enums");
const admin_entity_1 = require("../../admin/dataModels/entities/admin.entity");
const subscriber_entity_1 = require("../../subscriber/dataModels/entities/subscriber.entity");
const response_1 = require("../../../utils/response");
const authUtility_1 = require("../../../utils/authUtility");
class AuthService {
    constructor() {
        this._authUtility = new authUtility_1.authUtility();
        this.userLogin = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, role } = request.body;
                if (!email || !password) {
                    response.status(common_1.BAD_REQUEST).send((0, response_1.CustomError)(common_1.BAD_REQUEST, "Please provide email and password"));
                    return;
                }
                if (!(yield (0, common_1.validateEmail)(email))) {
                    console.error(`Invalid email`);
                    response.status(common_1.BAD_REQUEST).send((0, response_1.CustomError)(common_1.BAD_REQUEST, "Invalid email"));
                    return;
                }
                let userRepository;
                let userQueryBuilder;
                const appDatasourse = yield (0, dataSource_1.getDataSource)();
                switch (role) {
                    case userRoles_enums_1.userRoles.SUBSCRIBER:
                        userRepository = appDatasourse.getRepository(subscriber_entity_1.subscribers);
                        userQueryBuilder = userRepository.createQueryBuilder("user");
                        break;
                    case userRoles_enums_1.userRoles.ADMIN:
                    case userRoles_enums_1.userRoles.SUPERADMIN:
                        userRepository = appDatasourse.getRepository(admin_entity_1.admins);
                        userQueryBuilder = userRepository.createQueryBuilder("user");
                        break;
                    default:
                        response.status(common_1.BAD_REQUEST).send((0, response_1.CustomError)(common_1.BAD_REQUEST, "Invalid role"));
                        return;
                }
                const user = yield userQueryBuilder.getOne();
                if (!user) {
                    console.error(`User not found`);
                    response.status(common_1.BAD_REQUEST).send((0, response_1.CustomError)(common_1.BAD_REQUEST, "User not found"));
                    return;
                }
                const passwordComparison = yield this._authUtility.comparePassword(password, user.password);
                if (!passwordComparison) {
                    console.error(`Invalid password`);
                    response.status(common_1.BAD_REQUEST).send((0, response_1.CustomError)(common_1.BAD_REQUEST, "Invalid password"));
                    return;
                }
                let userid;
                switch (role) {
                    case userRoles_enums_1.userRoles.SUBSCRIBER:
                        userid = user.subscriberId;
                    default:
                        userid = user.user_id;
                        break;
                }
                let loginResponse = yield (0, common_1.generateTokens)(user.userRole, user.subscriberId ? user.subscriberId : userid);
                response.status(common_1.SUCCESS_GET).send((0, response_1.Success)(loginResponse));
            }
            catch (error) {
                console.error("Error while user login", error);
                throw error;
            }
        });
    }
}
exports.AuthService = AuthService;
