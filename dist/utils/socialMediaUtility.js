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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAllTokens = exports.updatePagesInDb = exports.updateUserAccessTokenInDb = exports.getPageAccessToken = exports.getLongLivedUserToken = exports.getSubscribersWithExpiringTokens = exports.checkForSubscribersMetaConnection = exports.checkForAdminMetaConnection = exports.fetchFacebookPages = exports.getMetaUserAccessTokenDb = exports.installMetaApp = exports.subscribeWebhook = exports.getAppAccessToken = exports.fetchingLeadDetails = exports.fetchingLeadgenData = exports.verifySignature = exports.facebookStrategyConfig = exports.CLIENT_FAILED_URL = exports.CLIENT_URL = void 0;
const crypto_1 = __importDefault(require("crypto"));
const adminSocialMedia_entity_1 = require("../socialMedia/dataModels/entities/adminSocialMedia.entity");
const subscriberSocialMedia_entity_1 = require("../socialMedia/dataModels/entities/subscriberSocialMedia.entity");
const adminFacebook_entity_1 = require("../socialMedia/dataModels/entities/adminFacebook.entity");
const admin_entity_1 = require("../users/admin/dataModels/entities/admin.entity");
const dataSource_1 = require("./dataSource");
// Social Media Utility Constants
exports.CLIENT_URL = process.env.FRONTEND_URL;
exports.CLIENT_FAILED_URL = process.env.FRONTEND_FAILED_URL;
exports.facebookStrategyConfig = {
    clientID: process.env.META_APP_ID,
    clientSecret: process.env.META_APP_SECRET,
    callbackURL: process.env.BACKEND_URL + '/facebook/callback',
    profileFields: ['id', 'displayName', 'emails'],
    state: true
};
// Social Media Utility Functions
const verifySignature = (signature, body, appSecret) => {
    if (!signature || !signature.startsWith('sha256=')) {
        return false;
    }
    const elements = signature.split('=');
    const method = elements[0];
    const signatureHash = elements[1];
    const expectedHash = crypto_1.default.createHmac('sha256', appSecret).update(body).digest('hex');
    return signatureHash === expectedHash;
};
exports.verifySignature = verifySignature;
const fetchingLeadgenData = (body) => {
    const { entry } = body;
    entry.forEach(page => {
        page.changes.forEach(change => {
            if (change.field === 'leadgen') {
                const leadgenId = change.value.leadgen_id;
                const pageId = change.value.page_id;
                return { leadgenId, pageId };
            }
        });
    });
};
exports.fetchingLeadgenData = fetchingLeadgenData;
const fetchingLeadDetails = (pageAccessToken, leadgenId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${pageAccessToken}`;
    try {
        const response = yield fetch(url);
        const data = yield response.json();
        return data;
    }
    catch (error) {
        console.error('Error fetching lead data:', error);
        return null;
    }
});
exports.fetchingLeadDetails = fetchingLeadDetails;
// Get App Access Token
const getAppAccessToken = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        let graphApiResponse = null;
        try {
            const url = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=client_credentials&client_id=${appId}&client_secret=${appSecret}`;
            const response = yield fetch(url);
            graphApiResponse = yield response.json();
            if (!graphApiResponse.access_token) {
                console.error("GET_APP_ACCESS_TOKEN:: Failed to obtain app access token");
                return;
            }
        }
        catch (error) {
            console.error('GET_APP_ACCESS_TOKEN:: Error while getting app access token', error);
            throw error;
        }
        console.log(graphApiResponse);
        // Delete old entries
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const adminSocialMediaRepository = appDataSource.getRepository(adminSocialMedia_entity_1.adminSocialMedia);
        const adminFacebookRepository = appDataSource.getRepository(adminFacebook_entity_1.AdminFacebookSettings);
        const adminRepository = appDataSource.getRepository(admin_entity_1.admins);
        try {
            const adminSocialMediaData = yield adminSocialMediaRepository.createQueryBuilder("adminSocialMedia")
                .leftJoinAndSelect("adminSocialMedia.admin", "admin")
                .leftJoinAndSelect("adminSocialMedia.facebook", "facebook")
                .getOne();
            if (adminSocialMediaData && adminSocialMediaData.adminSocialMediaId && adminSocialMediaData.facebook.adminFacebookSettingsId) {
                yield adminSocialMediaRepository.delete({ adminSocialMediaId: adminSocialMediaData.adminSocialMediaId });
                yield adminFacebookRepository.delete({ adminFacebookSettingsId: adminSocialMediaData.facebook.adminFacebookSettingsId });
            }
        }
        catch (error) {
            console.error('GET_APP_ACCESS_TOKEN:: Error while deleting old entries', error);
            throw error;
        }
        try {
            const admin = yield adminRepository.createQueryBuilder("admin").getOne();
            if (!admin) {
                console.error("Admin not found");
                return;
            }
            const adminFacebookSettingsEntity = new adminFacebook_entity_1.AdminFacebookSettings();
            adminFacebookSettingsEntity.appAccessToken = graphApiResponse.access_token;
            const facebookEntityData = yield adminFacebookRepository.save(adminFacebookSettingsEntity);
            const adminSocialMediaEntity = new adminSocialMedia_entity_1.adminSocialMedia();
            adminSocialMediaEntity.admin = admin;
            adminSocialMediaEntity.facebook = facebookEntityData;
            yield adminSocialMediaRepository.save(adminSocialMediaEntity);
        }
        catch (error) {
            console.error('GET_APP_ACCESS_TOKEN:: Error while saving admin social media details', error);
            throw error;
        }
        return console.log('Admin app access token fetched successfully');
    }
    catch (error) {
        console.log('Error fetching app access token:', error);
    }
});
exports.getAppAccessToken = getAppAccessToken;
// Subscribe & Configure Webhook
const subscribeWebhook = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const adminSocialMediaRepository = appDataSource.getRepository(adminSocialMedia_entity_1.adminSocialMedia);
        const adminSocialMediaQuerybuilder = adminSocialMediaRepository.createQueryBuilder('adminSocialMedia');
        const adminSocialMediaData = yield adminSocialMediaQuerybuilder
            .leftJoinAndSelect("adminSocialMedia.admin", "admin")
            .leftJoinAndSelect("adminSocialMedia.facebook", "facebook")
            .getOne();
        if (adminSocialMediaData) {
            const appId = process.env.META_APP_ID;
            const verifyToken = process.env.META_APP_VERIFY_TOKEN;
            const callbackUrl = process.env.BACKEND_URL + '/api/meta/webhook/facebook';
            const appAccessToken = adminSocialMediaData.facebook.appAccessToken;
            const url = `https://graph.facebook.com/v20.0/${appId}/subscriptions?access_token=${appAccessToken}`;
            const data = {
                object: 'page',
                fields: [
                    'leadgen',
                ],
                access_token: appAccessToken,
                callback_url: callbackUrl,
                include_values: 'true',
                verify_token: verifyToken,
            };
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
            };
            const bodyData = Object.assign(Object.assign({}, data), { fields: data.fields.join(',') });
            // Use URLSearchParams to serialize the data
            const body = new URLSearchParams(bodyData);
            const response = yield fetch(url, { method: 'post', headers, body });
            const responseData = yield response.json();
            console.log(responseData);
            return console.log('Webhook subscribed successfully');
        }
    }
    catch (error) {
        console.log('Error while subscribing webhook', error);
        throw error;
    }
});
exports.subscribeWebhook = subscribeWebhook;
// Installing Meta App in Facebook Pages
const installMetaApp = (subscriberId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia_entity_1.subscriberSocialMedia);
        const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
        const subscriberSocialMediaData = yield subscriberSocialMediaQueryBuilder
            .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
            .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
            .where("subscriber.subscriberId = :subscriberId", { subscriberId })
            .getOne();
        if (subscriberSocialMediaData) {
            const pageId = subscriberSocialMediaData.facebook.pageId;
            const pageAccessToken = subscriberSocialMediaData.facebook.pageAccessToken;
            const url = `https://graph.facebook.com/v20.0/${pageId}/subscribed_apps`;
            const response = yield fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscribed_fields: 'leadgen',
                    access_token: pageAccessToken,
                }),
            });
            if (!response.ok) {
                const errorData = yield response.json();
                console.log('Error subscribing to Meta App:', errorData);
                return;
            }
            const responseData = yield response.json();
            return console.log('Successfully Installed Meta App:', responseData);
        }
        else {
            return console.log(`No social media data found for subscriber with ID ${subscriberId}`);
        }
    }
    catch (error) {
        return console.log('Error while installing Meta App', error);
    }
});
exports.installMetaApp = installMetaApp;
const getMetaUserAccessTokenDb = (subscriberId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia_entity_1.subscriberSocialMedia);
        const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
        const subscriberSocialMediaData = yield subscriberSocialMediaQueryBuilder
            .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
            .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
            .where("subscriber.subscriberId = :subscriberId", { subscriberId })
            .getOne();
        if (!subscriberSocialMediaData) {
            console.log(`No facebook user access token found for subscriber with ID ${subscriberId}`);
            return null;
        }
        return subscriberSocialMediaData.facebook.userAccessToken;
    }
    catch (error) {
        console.log('Error while fetching user access token from database', error);
        throw error;
    }
});
exports.getMetaUserAccessTokenDb = getMetaUserAccessTokenDb;
const fetchFacebookPages = (userAccessToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`);
        const data = yield response.json();
        if (data.error)
            throw new Error(data.error.message);
        return data.data;
    }
    catch (error) {
        console.log('Error while fetching page details', error);
        throw error;
    }
});
exports.fetchFacebookPages = fetchFacebookPages;
const checkForAdminMetaConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const adminSocialMediaRepository = appDataSource.getRepository(adminSocialMedia_entity_1.adminSocialMedia);
        const adminSocialMediaQuerybuilder = adminSocialMediaRepository.createQueryBuilder('adminSocialMedia');
        const adminSocialMediaData = yield adminSocialMediaQuerybuilder
            .leftJoinAndSelect("adminSocialMedia.admin", "admin")
            .leftJoinAndSelect("adminSocialMedia.facebook", "facebook")
            .getOne();
        if (adminSocialMediaData && adminSocialMediaData.facebook.appAccessToken)
            return true;
        else
            return false;
    }
    catch (error) {
        console.log('Error while fetching admin social media details', error);
        throw error;
    }
});
exports.checkForAdminMetaConnection = checkForAdminMetaConnection;
const subscriberSocialMediaRepo = (subscriberId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia_entity_1.subscriberSocialMedia);
        const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
        const subscriberSocialMediaData = yield subscriberSocialMediaQueryBuilder
            .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
            .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
            .where("subscriber.subscriberId = :subscriberId", { subscriberId })
            .getOne();
        return subscriberSocialMediaData;
    }
    catch (error) {
        console.log("Error while fetching subscriber social media repo");
        throw error;
    }
});
const checkForSubscribersMetaConnection = (subscriberId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscriberSocialMediaData = yield subscriberSocialMediaRepo(subscriberId);
        if (subscriberSocialMediaData && subscriberSocialMediaData.facebook.userAccessToken)
            return true;
        else
            return false;
    }
    catch (error) {
        console.log("Error while fetching subscriber social media details!");
        throw error;
    }
});
exports.checkForSubscribersMetaConnection = checkForSubscribersMetaConnection;
const getSubscribersWithExpiringTokens = (subscriberId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscriberSocialMediaData = yield subscriberSocialMediaRepo(subscriberId);
        if (!subscriberSocialMediaData)
            return null;
        return subscriberSocialMediaData;
    }
    catch (error) {
        console.log('Error while fetching subscriber social media details', error);
        throw error;
    }
});
exports.getSubscribersWithExpiringTokens = getSubscribersWithExpiringTokens;
// Convert short-lived token to long-lived token
const getLongLivedUserToken = (shortLivedToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        const url = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
        const response = yield fetch(url);
        const data = yield response.json();
        if (data.access_token) {
            return data.access_token;
        }
        else {
            throw new Error("Failed to obtain long-lived token");
        }
    }
    catch (error) {
        console.log('Error while converting short-lived token to long-lived token', error);
        throw error;
    }
});
exports.getLongLivedUserToken = getLongLivedUserToken;
// Get page access token
const getPageAccessToken = (pageId, userAccessToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `https://graph.facebook.com/v20.0/${pageId}/accounts?access_token=${userAccessToken}`;
        const response = yield fetch(url);
        const data = yield response.json();
        if (data.data && data.data.length > 0) {
            return data.data[0].access_token;
        }
        else {
            throw new Error("Failed to obtain page access token");
        }
    }
    catch (error) {
        console.log('Error while getting page access token', error);
        throw error;
    }
});
exports.getPageAccessToken = getPageAccessToken;
// Updating user access token in database
const updateUserAccessTokenInDb = (subscriberId, userAccessToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia_entity_1.subscriberSocialMedia);
        const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
        const subscriberSocialMediaData = yield subscriberSocialMediaQueryBuilder
            .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
            .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
            .where("subscriber.subscriberId = :subscriberId", { subscriberId })
            .getOne();
        if (!subscriberSocialMediaData) {
            console.log(`No social media data found for subscriber with ID ${subscriberId}`);
            return null;
        }
        subscriberSocialMediaData.facebook.userAccessToken = userAccessToken;
        subscriberSocialMediaData.facebook.userTokenExpiresAt = new Date(Date.now() + 3600000);
        yield subscriberSocialMediaRepository.save(subscriberSocialMediaData);
    }
    catch (error) {
        console.log('Error while updating user access token in database', error);
        throw error;
    }
});
exports.updateUserAccessTokenInDb = updateUserAccessTokenInDb;
// Updating page access token in database
const updatePagesInDb = (subscriberId, pageAccessToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia_entity_1.subscriberSocialMedia);
        const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
        const subscriberSocialMediaData = yield subscriberSocialMediaQueryBuilder
            .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
            .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
            .where("subscriber.subscriberId = :subscriberId", { subscriberId })
            .getOne();
        if (!subscriberSocialMediaData) {
            console.log(`No social media data found for subscriber with ID ${subscriberId}`);
            return null;
        }
        subscriberSocialMediaData.facebook.pageAccessToken = pageAccessToken;
        subscriberSocialMediaData.facebook.pageTokenExpiresAt = new Date(Date.now() + 3600000);
        yield subscriberSocialMediaRepository.save(subscriberSocialMediaData);
    }
    catch (error) {
        console.log('Error while updating page access token in database', error);
        throw error;
    }
});
exports.updatePagesInDb = updatePagesInDb;
// Helper function to check if token needs refreshing
const needsRefresh = (expiryDate) => {
    const refreshThreshold = 7 * 24 * 60 * 60 * 1000; // e.g., 7 days before expiry
    const expiryTimestamp = new Date(expiryDate).getTime();
    const currentTimestamp = Date.now();
    // Check if the time remaining before expiry is less than the threshold
    return expiryTimestamp - currentTimestamp < refreshThreshold;
};
// Refreshing facebook user and page access token
const refreshAllTokens = (subscriberId) => __awaiter(void 0, void 0, void 0, function* () {
    const subscriber = yield (0, exports.getSubscribersWithExpiringTokens)(subscriberId);
    if (subscriber) {
        try {
            // Refresh user token if it's close to expiry
            if (subscriber.facebook.userTokenExpiresAt && needsRefresh(subscriber.facebook.userTokenExpiresAt)) {
                const newUserToken = yield (0, exports.getLongLivedUserToken)(subscriber.facebook.userAccessToken);
                yield (0, exports.updateUserAccessTokenInDb)(subscriber.subscriber.subscriberId, newUserToken);
            }
            // Refresh page tokens if the user token was updated or nearing expiry
            if (subscriber.facebook.pageTokenExpiresAt && needsRefresh(subscriber.facebook.pageTokenExpiresAt)) {
                const newPageTokens = yield (0, exports.getPageAccessToken)(subscriber.facebook.pageId, subscriber.facebook.userAccessToken);
                yield (0, exports.updatePagesInDb)(subscriber.subscriber.subscriberId, newPageTokens);
            }
        }
        catch (error) {
            console.error(`Error refreshing tokens for subscriber ${subscriber.subscriber.subscriberId}:`, error);
        }
    }
});
exports.refreshAllTokens = refreshAllTokens;
