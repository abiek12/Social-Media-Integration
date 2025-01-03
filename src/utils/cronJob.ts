import { CronJob } from "cron";
import { getAllSubscribers } from "./common";
import { checkAdminMetaConnection, checkForSubscribersMetaConnection, checkWebhookSubscription, getAppAccessToken, refreshAllTokens, subscribeWebhook } from "./socialMediaUtility";

export const cronJob = new CronJob("*/1 * * * *", async () => {
    console.log("Cron job running");
    const subscribers = await getAllSubscribers();
    
    if(subscribers.length > 0) {
        for (const subscriber of subscribers) { 
            if(await checkForSubscribersMetaConnection(subscriber.subscriberId)) {
                // Refresh user and page token if it's close to expiry
                refreshAllTokens(subscriber.subscriberId);
            }
        }
    }
    
    if(!await checkAdminMetaConnection()) {
        // Admin Meta app access token fetching.
        await getAppAccessToken();
    }
    
    // Admin Meta webhook subscription if not subscribed.
    if(!await checkWebhookSubscription()) {
        await subscribeWebhook('page', ['messages', 'leadgen']);
        // webhook for instagram and whatsapp must be configured using the App Dashboard.
    }
},
null,
true
);