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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaServices = void 0;
const subscriberSocialMedia_entity_1 = require("../dataModels/entities/subscriberSocialMedia.entity");
const subscriberFacebook_entity_1 = require("../dataModels/entities/subscriberFacebook.entity");
const dataSource_1 = require("../../utils/dataSource");
const response_1 = require("../../utils/response");
const common_1 = require("../../utils/common");
const socialMediaUtility_1 = require("../../utils/socialMediaUtility");
class metaServices {
    constructor() {
        // Meta Webhook Verification Endpoint
        this.verifyWebhook = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query;
            if (mode === 'subscribe' && token === process.env.META_APP_VERIFY_TOKEN) {
                response.status(common_1.SUCCESS_GET).send(challenge);
                console.log('WEBHOOK:: Verified webhook');
                return;
            }
            response.status(common_1.FORBIDDEN).send('Forbidden');
        });
        // Meta Webhook Event Notification Endpoint
        this.handleWebhook = (request, response) => __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c, _d, e_2, _e, _f;
            const signature = request.headers['x-hub-signature'];
            const body = request.body;
            console.log(body);
            const appSecret = process.env.META_APP_SECRET;
            if (appSecret) {
                if (!(0, socialMediaUtility_1.verifySignature)(signature, body, appSecret)) {
                    console.error('App Secret is not valid');
                    response.status(common_1.FORBIDDEN).send((0, response_1.CustomError)(common_1.FORBIDDEN, 'Forbidden'));
                    return;
                }
            }
            else {
                console.error('META_APP_SECRET is not defined');
                response.status(common_1.FORBIDDEN).send((0, response_1.CustomError)(common_1.FORBIDDEN, 'Forbidden'));
                return;
            }
            console.info("request header X-Hub-Signature validated");
            response.status(common_1.SUCCESS_GET).send('EVENT_RECEIVED');
            // fetching leadgen id and page id from webhook data
            const { leadgenId, pageId } = (0, socialMediaUtility_1.fetchingLeadgenData)(body);
            if (leadgenId && pageId) {
                const appDataSource = yield (0, dataSource_1.getDataSource)();
                const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia_entity_1.subscriberSocialMedia);
                const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
                const subscriberSocialMediaData = yield subscriberSocialMediaQueryBuilder
                    .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
                    .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
                    .where("facebook.pageId = :pageId", { pageId })
                    .getOne();
                if (subscriberSocialMediaData) {
                    const subscriberId = subscriberSocialMediaData.subscriber.subscriberId;
                    const pageAccessToken = subscriberSocialMediaData.facebook.pageAccessToken;
                    // fetching actual lead data with page access token and leadgen id using meta graph api
                    const leadData = yield (0, socialMediaUtility_1.fetchingLeadDetails)(pageAccessToken, leadgenId);
                    if (leadData) {
                        let email = null;
                        let fullName = null;
                        let phoneNumber = null;
                        let country = null;
                        let state = null;
                        let city = null;
                        let leadText = null;
                        let companyName = null;
                        let designation = null;
                        try {
                            for (var _g = true, _h = __asyncValues(leadData.field_data), _j; _j = yield _h.next(), _a = _j.done, !_a; _g = true) {
                                _c = _j.value;
                                _g = false;
                                let lead = _c;
                                try {
                                    for (var _k = true, _l = (e_2 = void 0, __asyncValues(lead.values)), _m; _m = yield _l.next(), _d = _m.done, !_d; _k = true) {
                                        _f = _m.value;
                                        _k = false;
                                        let value = _f;
                                        switch (lead.name) {
                                            case "email":
                                                email = value;
                                                break;
                                            case "full_name":
                                                fullName = value;
                                                break;
                                            case "phone":
                                                phoneNumber = value;
                                                break;
                                            case "country":
                                                country = value;
                                                break;
                                            case "state":
                                                state = value;
                                                break;
                                            case "city":
                                                city = value;
                                                break;
                                            case "leadText":
                                                leadText = value;
                                                break;
                                            case "company_name":
                                                companyName = value;
                                                break;
                                            case "job_title":
                                                designation = value;
                                                break;
                                            default:
                                                break;
                                        }
                                    }
                                }
                                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                finally {
                                    try {
                                        if (!_k && !_d && (_e = _l.return)) yield _e.call(_l);
                                    }
                                    finally { if (e_2) throw e_2.error; }
                                }
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (!_g && !_a && (_b = _h.return)) yield _b.call(_h);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        console.log(leadData);
                    }
                }
            }
        });
        // Fetch facebook pages of the subscriber.
        this.fetchPages = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                const subscriberId = request.user.userId;
                const userAceessToken = yield (0, socialMediaUtility_1.getMetaUserAccessTokenDb)(subscriberId);
                if (!userAceessToken) {
                    console.error("User not authenticated to fetch facebook pages!");
                    response.status(common_1.NOT_AUTHORIZED).send((0, response_1.CustomError)(common_1.NOT_AUTHORIZED, "User not authenticated to fetch facebook pages!"));
                    return;
                }
                const pageDetails = yield (0, socialMediaUtility_1.fetchFacebookPages)(userAceessToken);
                response.status(common_1.SUCCESS_GET).send((0, response_1.Success)(pageDetails));
                return;
            }
            catch (error) {
                console.error("Error in fetching facebook pages", error);
                response.status(common_1.INTERNAL_ERROR).send((0, response_1.CustomError)(common_1.INTERNAL_ERROR, common_1.ERROR_COMMON_MESSAGE));
                return;
            }
        });
        // Handler for choosing facebook pages
        this.choosePages = (request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                const subscriberId = request.user.userId;
                const pageDatas = request.body;
                if (!pageDatas) {
                    console.error("Page data not found");
                    response.status(common_1.BAD_REQUEST).send((0, response_1.CustomError)(common_1.BAD_REQUEST, "Page data not found!"));
                    return;
                }
                const appDataSource = yield (0, dataSource_1.getDataSource)();
                const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia_entity_1.subscriberSocialMedia);
                const subscriberFacebookRepository = appDataSource.getRepository(subscriberFacebook_entity_1.SubscriberFacebookSettings);
                const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
                const existingSubscriber = yield (0, common_1.checkSubscriberExitenceUsingId)(subscriberId);
                if (!existingSubscriber) {
                    console.error("Subscriber not found");
                    response.status(common_1.NOT_FOUND).send((0, response_1.CustomError)(common_1.NOT_FOUND, "Subscriber not found!"));
                    return;
                }
                const existingSubscriberSocialMediaData = yield subscriberSocialMediaQueryBuilder
                    .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
                    .leftJoinAndSelect("subscriberSocialMedia.facebook", "facebook")
                    .where("subscriber.subscriberId = :subscriberId", { subscriberId })
                    .getMany();
                if (existingSubscriberSocialMediaData.length > 0) {
                    for (const invidualData of existingSubscriberSocialMediaData) {
                        yield subscriberFacebookRepository.delete(invidualData.facebook.subFacebookSettingsId);
                        yield subscriberSocialMediaRepository.delete(invidualData.subscriberSocialMediaId);
                    }
                }
                for (const pageData of pageDatas) {
                    const subscriberFacebookEntity = new subscriberFacebook_entity_1.SubscriberFacebookSettings();
                    subscriberFacebookEntity.pageId = pageData.id;
                    subscriberFacebookEntity.pageAccessToken = pageData.access_token;
                    subscriberFacebookEntity.pageName = pageData.name;
                    subscriberFacebookEntity.pageTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
                    const facebookEntityResponse = yield subscriberFacebookRepository.save(subscriberFacebookEntity);
                    const subscriberSocialMediaEntity = new subscriberSocialMedia_entity_1.subscriberSocialMedia();
                    subscriberSocialMediaEntity.facebook = facebookEntityResponse;
                    subscriberSocialMediaEntity.subscriber = existingSubscriber;
                    yield subscriberSocialMediaRepository.save(subscriberSocialMediaEntity);
                }
                // Installing meta app on the subscriber's facebook pages
                yield (0, socialMediaUtility_1.installMetaApp)(subscriberId);
                console.info("Pages added successfully");
                response.status(common_1.SUCCESS_GET).send((0, response_1.Success)("Pages added successfully!"));
                return;
            }
            catch (error) {
                console.error("Error in fetching facebook pages", error);
                response.status(common_1.INTERNAL_ERROR).send((0, response_1.CustomError)(common_1.INTERNAL_ERROR, common_1.ERROR_COMMON_MESSAGE));
                return;
            }
        });
    }
}
exports.metaServices = metaServices;
