import { Strategy as FacebookStrategy } from "passport-facebook";
import { facebookStrategyConfig, findUserByProfileId, getLongLivedUserToken } from "./socialMediaUtility";
import passport from "passport";
import { subscriberSocialMedia } from "../socialMedia/dataModels/entities/subscriberSocialMedia.entity";
import { getDataSource } from "./dataSource";
import { checkSubscriberExitenceUsingId, getSubscriberSocialMediaData } from "./common";
import { socialMediaType } from "../socialMedia/dataModels/enums/socialMedia.enums";


// Serialize user ID to store in the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);  // Store user ID in session
});

// Deserialize user using the ID stored in the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await findUserByProfileId(id);  // Fetch the user from the database
    done(null, user);  // Pass the full user object back
  } catch (err) {
    done(err, null);
  }
});

passport.use(new FacebookStrategy( (facebookStrategyConfig as any), 
  async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) /*callback function */ => {
  try {
    let subscriberId = req.query.state;
    const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);

    if(!existingSubscriber) {
      return done(null, false);
    }
    
    const appDataSource = await getDataSource();
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaData = await getSubscriberSocialMediaData(existingSubscriber.subscriberId, profile);
    const longLivedUserAccessToken = await getLongLivedUserToken(accessToken);

    if (subscriberSocialMediaData) {
      subscriberSocialMediaData.userAccessToken = longLivedUserAccessToken;
      subscriberSocialMediaData.userTokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // Setting 60 days of expiry for long lived access token
      subscriberSocialMediaRepository.save(subscriberSocialMediaData);
      return done(null, profile);

    } else {
      const subscriberSocialMediaEntity = new subscriberSocialMedia();
      subscriberSocialMediaEntity.userAccessToken = longLivedUserAccessToken;
      subscriberSocialMediaEntity.userTokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // Setting 60 days of expiry for long lived access token
      subscriberSocialMediaEntity.socialMedia = socialMediaType.FACEBOOK;
      subscriberSocialMediaEntity.profileId = profile.id;
      subscriberSocialMediaEntity.subscriber = existingSubscriber;
      await subscriberSocialMediaRepository.save(subscriberSocialMediaEntity);

      return done(null, profile);
    }

  } catch (error) {
    console.log("Error in facebook authentication", error);
    done(error, null);
  }
}));
