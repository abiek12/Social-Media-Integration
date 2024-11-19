import { Strategy as FacebookStrategy } from "passport-facebook";
import { facebookStrategyConfig, findUserByProfileId } from "../../utils/socialMediaUtility";
import passport from "passport";
import { subscriberSocialMedia } from "../dataModels/entities/subscriberSocialMedia.entity";
import { getDataSource } from "../../utils/dataSource";
import { checkSubscriberExitenceUsingId, getSubscriberSocialMediaData } from "../../utils/common";
import { socialMediaType } from "../dataModels/enums/socialMedia.enums";


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
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaData = await getSubscriberSocialMediaData(existingSubscriber.subscriberId, profile);

    if (subscriberSocialMediaData) {
      subscriberSocialMediaData.userAccessToken = accessToken;
      subscriberSocialMediaData.userTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      subscriberSocialMediaRepository.save(subscriberSocialMediaData);
      return done(null, profile);

    } else {
      const subscriberSocialMediaEntity = new subscriberSocialMedia();
      subscriberSocialMediaEntity.userAccessToken = accessToken;
      subscriberSocialMediaEntity.userTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
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
