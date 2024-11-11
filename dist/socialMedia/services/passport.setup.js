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
const passport_facebook_1 = require("passport-facebook");
const subscriberFacebook_entity_1 = require("../dataModels/entities/subscriberFacebook.entity");
const socialMediaUtility_1 = require("../../utils/socialMediaUtility");
const passport_1 = __importDefault(require("passport"));
const subscriberSocialMedia_entity_1 = require("../dataModels/entities/subscriberSocialMedia.entity");
const dataSource_1 = require("../../utils/dataSource");
const common_1 = require("../../utils/common");
// Serialize user ID to store in the session
passport_1.default.serializeUser((user, done) => {
    done(null, user.id); // Store user ID in session
});
// Deserialize user using the ID stored in the session
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, socialMediaUtility_1.findUserByProfileId)(id); // Fetch the user from the database
        done(null, user); // Pass the full user object back
    }
    catch (err) {
        done(err, null);
    }
}));
passport_1.default.use(new passport_facebook_1.Strategy(socialMediaUtility_1.facebookStrategyConfig, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let subscriberId = 3;
        const existingSubscriber = yield (0, common_1.checkSubscriberExitenceUsingId)(subscriberId);
        if (!existingSubscriber) {
            return done(null, false);
        }
        const appDataSource = yield (0, dataSource_1.getDataSource)();
        const subscriberFacebookRepository = appDataSource.getRepository(subscriberFacebook_entity_1.SubscriberFacebookSettings);
        const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");
        const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia_entity_1.subscriberSocialMedia);
        const subscriberSocialMediaData = yield (0, common_1.getSubscriberSocialMediaData)(existingSubscriber.subscriberId, profile);
        if (subscriberSocialMediaData) {
            const subscriberFacebookData = yield subscriberFacebookQueryBuilder
                .where("subscriberFacebook.subFacebookSettingsId = :id", { id: subscriberSocialMediaData.facebook.subFacebookSettingsId })
                .getOne();
            if (subscriberFacebookData) {
                subscriberFacebookData.userAccessToken = accessToken;
                yield subscriberFacebookRepository.save(subscriberFacebookData);
                return done(null, profile);
            }
        }
        else {
            const subscriberFacebookEntity = new subscriberFacebook_entity_1.SubscriberFacebookSettings();
            subscriberFacebookEntity.profileId = profile.id;
            subscriberFacebookEntity.userAccessToken = accessToken;
            subscriberFacebookEntity.userTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
            const response = yield subscriberFacebookRepository.save(subscriberFacebookEntity);
            const subscriberSocialMediaEntity = new subscriberSocialMedia_entity_1.subscriberSocialMedia();
            subscriberSocialMediaEntity.facebook = response;
            subscriberSocialMediaEntity.subscriber = existingSubscriber;
            yield subscriberSocialMediaRepository.save(subscriberSocialMediaEntity);
            return done(null, profile);
        }
    }
    catch (error) {
        console.log("Error in facebook authentication", error);
        done(error, null);
    }
})));
