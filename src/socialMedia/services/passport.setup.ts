import { Strategy as FacebookStrategy } from "passport-facebook";
import { SubscriberFacebookSettings } from "../dataModels/entities/subscriberFacebook.entity";
import { facebookStrategyConfig, findUserByProfileId } from "../../utils/socialMediaUtility";
import passport from "passport";
import { subscriberSocialMedia } from "../dataModels/entities/subscriberSocialMedia.entity";
import { getDataSource } from "../../utils/dataSource";
import { checkSubscriberExitenceUsingId, getSubscriberSocialMediaData } from "../../utils/common";


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

passport.use(new FacebookStrategy( facebookStrategyConfig, 
  async (accessToken: string, refreshToken: string, profile: any, done: any) /*callback function */ => {
  try {
    let subscriberId = 1;
    const existingSubscriber = await checkSubscriberExitenceUsingId(subscriberId);

    if(!existingSubscriber) {
      return done(null, false);
    }
    
    const appDataSource = await getDataSource();
    const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
    const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaData = await getSubscriberSocialMediaData(existingSubscriber.subscriberId, profile);

    if (subscriberSocialMediaData) {
      const subscriberFacebookData = await subscriberFacebookQueryBuilder
        .where("subscriberFacebook.subFacebookSettingsId = :id", { id: subscriberSocialMediaData.facebook.subFacebookSettingsId })
        .getOne();
      if (subscriberFacebookData) {
        subscriberFacebookData.userAccessToken = accessToken;
        await subscriberFacebookRepository.save(subscriberFacebookData);

        return done(null, profile);
      }
    } else {
      const subscriberFacebookEntity = new SubscriberFacebookSettings();
      subscriberFacebookEntity.profileId = profile.id;
      subscriberFacebookEntity.userAccessToken = accessToken;
      subscriberFacebookEntity.userTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      const response = await subscriberFacebookRepository.save(subscriberFacebookEntity);

      const subscriberSocialMediaEntity = new subscriberSocialMedia();
      subscriberSocialMediaEntity.facebook = response;
      subscriberSocialMediaEntity.subscriber = existingSubscriber;
      await subscriberSocialMediaRepository.save(subscriberSocialMediaEntity);

      return done(null, profile);
    }

  } catch (error) {
    console.log("Error in facebook authentication", error);
    done(error, null);
  }
}));
