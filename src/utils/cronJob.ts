import { CronJob } from "cron";
import { getAllSubscribers } from "./common";
import { checkForAdminMetaConnection, checkForSubscribersMetaConnection, getAppAccessToken, refreshAllTokens, subscribeWebhook } from "./socialMediaUtility";

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
    
    const data = await checkForAdminMetaConnection();
    
    // Admin Meta webhook subscription and fetching app access token for the first time. This conditon is for avoiding multiple webhook subscriptions.
    if(!data) {
        await getAppAccessToken();
        await subscribeWebhook();
    }

    // Admin Meta app access token refresh
    await getAppAccessToken();
},
null,
true
);