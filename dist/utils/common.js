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
exports.generateTokens = exports.validateEmail = exports.getAllSubscribers = exports.getSubscriberSocialMediaData = exports.createAdminUser = exports.OTP_EXPIRY_TIME = exports.ACTIVATION_KEY_EXPIRY_DAYS = exports.REFRESH_TOKEN_EXPIRY = exports.TOKEN_EXPIRY = exports.lockoutTime = exports.lockoutCount = exports.ERROR_COMMON_MESSAGE = exports.REDIRECT = exports.NOT_ACCEPTABLE = exports.INTERNAL_ERROR = exports.NOT_AUTHORIZED = exports.FORBIDDEN = exports.NOT_FOUND = exports.SUCCESS_GET = exports.SUCCESS_CREATE = exports.CONFLICT = exports.BAD_REQUEST = void 0;
exports.checkSubscriberExitenceUsingId = checkSubscriberExitenceUsingId;
const subscriberSocialMedia_entity_1 = require("../socialMedia/dataModels/entities/subscriberSocialMedia.entity");
const admin_entity_1 = require("../users/admin/dataModels/entities/admin.entity");
const subscriber_entity_1 = require("../users/subscriber/dataModels/entities/subscriber.entity");
const userRoles_enums_1 = require("../users/subscriber/dataModels/enums/userRoles.enums");
const authUtility_1 = require("./authUtility");
const dataSource_1 = require("./dataSource");
exports.BAD_REQUEST = 400;
exports.CONFLICT = 409;
exports.SUCCESS_CREATE = 201;
exports.SUCCESS_GET = 200;
exports.NOT_FOUND = 404;
exports.FORBIDDEN = 403;
exports.NOT_AUTHORIZED = 401;
exports.INTERNAL_ERROR = 500;
exports.NOT_ACCEPTABLE = 406;
exports.REDIRECT = 302;
exports.ERROR_COMMON_MESSAGE = "Internal Server Error";
exports.lockoutCount = 5;
exports.lockoutTime = 120; // 7days
exports.TOKEN_EXPIRY = 360000;
exports.REFRESH_TOKEN_EXPIRY = 86400000;
exports.ACTIVATION_KEY_EXPIRY_DAYS = 1;
exports.OTP_EXPIRY_TIME = 10;
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
function checkSubscriberExitenceUsingId(subscriberId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const appDataSource = yield (0, dataSource_1.getDataSource)();
            const subscriberRepository = appDataSource.getRepository(subscriber_entity_1.subscribers);
            const subscriber = yield subscriberRepository
                .createQueryBuilder("subscriber")
                .where("subscriber.subscriberId = :subscriberId", {
                subscriberId: subscriberId,
            })
                .andWhere("subscriber.isDeleted = :isDeleted", { isDeleted: false })
                .andWhere("subscriber.emailVarified = :emailVarified", {
                emailVarified: true,
            })
                .select([
                "subscriber.subscriberId",
                "subscriber.userName",
                "subscriber.company",
                "subscriber.email",
                "subscriber.contactNumber",
                "subscriber.country",
                "subscriber.state",
                "subscriber.city",
                "subscriber.pincode",
                "subscriber.gstNumber",
                "subscriber.logo",
                "subscriber.cdrAutoConvert",
                "subscriber.emailOtp",
                "subscriber.prefix",
                "subscriber.currency",
            ])
                .getOne();
            return subscriber;
        }
        catch (error) {
            throw error;
        }
    });
}
const getSubscriberSocialMediaData = (subscriberId, profile) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia_entity_1.subscriberSocialMedia);
        const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
        const subscriberSocialMediaData = yield subscriberSocialMediaQueryBuilder
            .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
            .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
            .where("facebook.profileId = :profileId", { profileId: profile.id })
            .andWhere("subscriber.subscriberId = :subscriberId", { subscriberId: subscriberId })
            .getOne();
        return subscriberSocialMediaData;
    }
    catch (error) {
        console.error('Error while fetching subscriber social media data', error);
        return false;
    }
});
exports.getSubscriberSocialMediaData = getSubscriberSocialMediaData;
const getAllSubscribers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const subscriberRepository = appDataSource.getRepository(subscriber_entity_1.subscribers);
        return yield subscriberRepository.find();
    }
    catch (error) {
        console.error('Error while fetching subscribers', error);
        return [];
    }
});
exports.getAllSubscribers = getAllSubscribers;
const validateEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email)
        return re.test(String(email).toLowerCase());
    return false;
});
exports.validateEmail = validateEmail;
const generateTokens = (userRole, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const _authUtility = new authUtility_1.authUtility();
    const accessToken = yield _authUtility.generateAccessToken(userRole, userId);
    const refreshToken = yield _authUtility.generateRefreshToken(userRole, userId);
    return { accessToken, refreshToken };
});
exports.generateTokens = generateTokens;
