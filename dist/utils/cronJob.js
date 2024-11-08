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
exports.cronJob = void 0;
const cron_1 = require("cron");
const common_1 = require("./common");
const socialMediaUtility_1 = require("./socialMediaUtility");
exports.cronJob = new cron_1.CronJob("*/1 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Cron job running");
    const subscribers = yield (0, common_1.getAllSubscribers)();
    if (subscribers.length > 0) {
        for (const subscriber of subscribers) {
            if (yield (0, socialMediaUtility_1.checkForSubscribersMetaConnection)(subscriber.subscriberId)) {
                // Refresh user and page token if it's close to expiry
                (0, socialMediaUtility_1.refreshAllTokens)(subscriber.subscriberId);
            }
        }
    }
    // Admin Meta app access token fetching.
    yield (0, socialMediaUtility_1.getAppAccessToken)();
    // Admin Meta webhook subscription if not subscribed.
    if (!(yield (0, socialMediaUtility_1.checkWebhookSubscription)())) {
        yield (0, socialMediaUtility_1.subscribeWebhook)();
    }
}), null, true);