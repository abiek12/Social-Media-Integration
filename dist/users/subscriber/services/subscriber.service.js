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
exports.subscriberService = void 0;
const common_1 = require("../../../utils/common");
const dataSource_1 = require("../../../utils/dataSource");
const response_1 = require("../../../utils/response");
const subscriber_entity_1 = require("../dataModels/entities/subscriber.entity");
const userRoles_enums_1 = require("../dataModels/enums/userRoles.enums");
class subscriberService {
    constructor() {
        this.subscriberRegistration = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, company, userName } = request.body;
                if (!email || !password || !company || !userName) {
                    response.status(common_1.BAD_REQUEST).send("Please provide email and password");
                    return;
                }
                if (!(yield (0, common_1.validateEmail)(email))) {
                    console.error(`Invalid email`);
                    response.status(common_1.BAD_REQUEST).send("Invalid email");
                    return;
                }
                const appDatasourse = yield (0, dataSource_1.getDataSource)();
                const subscriberRepository = appDatasourse.getRepository(subscriber_entity_1.subscribers);
                const existingSubscribersWithSameEmail = yield subscriberRepository.findOneBy({ email: email });
                if (existingSubscribersWithSameEmail) {
                    response.status(common_1.CONFLICT).send("Email already exists");
                    return;
                }
                const subscriber = new subscriber_entity_1.subscribers();
                subscriber.email = email;
                subscriber.company = company;
                subscriber.userName = userName;
                subscriber.password = password;
                subscriber.userRole = userRoles_enums_1.userRoles.SUBSCRIBER;
                yield subscriberRepository.save(subscriber);
                console.log("Subscriber registered successfully");
                response.status(common_1.SUCCESS_GET).send((0, response_1.Success)("Subscriber registered successfully"));
                return;
            }
            catch (error) {
                console.error("Error while subscriber registration", error);
                return error;
            }
        });
    }
}
exports.subscriberService = subscriberService;
