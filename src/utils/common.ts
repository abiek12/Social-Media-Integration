import { SubscriberFacebookSettings } from "../socialMedia/dataModels/entities/subscriberFacebook.entity";
import { subscriberSocialMedia } from "../socialMedia/dataModels/entities/subscriberSocialMedia.entity";
import { SubscriberWhatsappSettings } from "../socialMedia/dataModels/entities/subscriberWhatsapp.entity";
import { socialMediaType } from "../socialMedia/dataModels/enums/socialMedia.enums";
import { admins } from "../users/admin/dataModels/entities/admin.entity";
import { subscribers } from "../users/subscriber/dataModels/entities/subscriber.entity";
import { userRoles } from "../users/subscriber/dataModels/enums/userRoles.enums";
import { authUtility } from "./authUtility";
import { getDataSource } from "./dataSource";

export const BAD_REQUEST = 400;
export const CONFLICT = 409;
export const SUCCESS_CREATE = 201;
export const SUCCESS_GET = 200;
export const NOT_FOUND = 404;
export const FORBIDDEN = 403;
export const NOT_AUTHORIZED = 401;
export const INTERNAL_ERROR = 500;
export const NOT_ACCEPTABLE = 406;
export const REDIRECT = 302;
export const ERROR_COMMON_MESSAGE = "Internal Server Error";

export const lockoutCount = 5;
export const lockoutTime = 120; // 7days
export const TOKEN_EXPIRY = 360000;
export const REFRESH_TOKEN_EXPIRY = 86400000;
export const ACTIVATION_KEY_EXPIRY_DAYS = 1;
export const OTP_EXPIRY_TIME = 10;

export const createAdminUser = async (data?: any) => {
  const _authUtility = new authUtility();
  console.log("createAdminUser");
  try {
    if (!process.env.adminEmail || !process.env.adminPassword) {
      console.log(`Admin email or password not found`);
      return false;
    }
    const appDatasourse = await getDataSource();
    const userRepository = appDatasourse.getRepository(admins);
    const exitingUser = await userRepository.findOneBy({
      email: process.env.adminEmail,
    });
    if (exitingUser) {
      console.log(`Admin user already exists`);
      return false;
    }
    const user = new admins();
    user.email = process.env.adminEmail;
    user.password = await _authUtility.hashPassword(process.env.adminPassword);
    user.userName = process.env.adminUserName || "admin";
    user.userRole = userRoles.SUPERADMIN;
    user.emailVarified = true;
    user.approved = true;
    await userRepository.save(user);
    console.log(`Admin user created successfully`);
    return true;
  } catch (error) {
    console.log(`Failed to create admin user: ${error}`);
    return false;
  }
};

export async function checkSubscriberExitenceUsingId(subscriberId: number) {
  try {
    const appDataSource = await getDataSource();
    const subscriberRepository = appDataSource.getRepository(subscribers);

    const subscriber = await subscriberRepository
      .createQueryBuilder("subscriber")
      .where("subscriber.subscriberId = :subscriberId", {
        subscriberId: subscriberId,
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
        "subscriber.address"
      ])
      .getOne();

    return subscriber;
  } catch (error) {
    throw error;
  }
}

export const getSubscriberSocialMediaData = async (subscriberId: number, profile: any) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");

    const subscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .where("subscriberSocialMedia.profileId = :profileId", { profileId: profile.id })
      .andWhere("subscriberSocialMedia.socialMedia = :socialMedia", { socialMedia: socialMediaType.FACEBOOK })
      .andWhere("subscriber.subscriberId = :subscriberId", { subscriberId: subscriberId })
      .getOne();

    return subscriberSocialMediaData;
  } catch (error) {
    console.error('Error while fetching subscriber social media data', error);
    return false;
  }
}

export const getAllSubscribers = async () => {
  try {
    const appDataSource = await getDataSource();
    const subscriberRepository = appDataSource.getRepository(subscribers);
    return await subscriberRepository.find();
  } catch (error) {
    console.error('Error while fetching subscribers', error);
    return [];
  }
}


export const validateEmail = async (email: String) => {
  let re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email) return re.test(String(email).toLowerCase());
  return false;
}

export const generateTokens = async (userRole: string, userId: number) => {
  const _authUtility = new authUtility();
  const accessToken = await _authUtility.generateAccessToken(userRole, userId);
  const refreshToken = await _authUtility.generateRefreshToken(userRole, userId);
  return { accessToken, refreshToken };
};

// Helper function to check if token needs refreshing
export const needsRefresh = (expiryDate: string | Date) => {
  const refreshThreshold = 7 * 24 * 60 * 60 * 1000; // e.g., 7 days before expiry
  const expiryTimestamp = new Date(expiryDate).getTime();
  const currentTimestamp = Date.now();
  
  // Check if the time remaining before expiry is less than the threshold
  return expiryTimestamp - currentTimestamp < refreshThreshold;
};


export const subscriberSocialMediaRepo = async (subscriberId: number) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberSocialMediaRepository = appDataSource.getRepository(subscriberSocialMedia);
    const subscriberSocialMediaQueryBuilder = subscriberSocialMediaRepository.createQueryBuilder("subscriberSocialMedia");
    const subscriberSocialMediaData = await subscriberSocialMediaQueryBuilder
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .where("subscriber.subscriberId = :subscriberId", { subscriberId })
      .andWhere("subscriberSocialMedia.socialMedia = :socialMedia", { socialMedia: socialMediaType.FACEBOOK })
      .getOne();
    return subscriberSocialMediaData;
  } catch (error) {
    console.log("Error while fetching subscriber social media repo", error);
    throw error;
  }
}

export const subscriberFacebookRepo = async (subscriberId: number) => {
  try {
    const appDataSource = await getDataSource();
    const subscriberFacebookRepository = appDataSource.getRepository(SubscriberFacebookSettings);
    const subscriberFacebookQueryBuilder = subscriberFacebookRepository.createQueryBuilder("subscriberFacebook");

    const subscriberFacebookData = await subscriberFacebookQueryBuilder
      .leftJoinAndSelect("subscriberFacebook.subscriberSocialMedia", "subscriberSocialMedia")
      .leftJoinAndSelect("subscriberSocialMedia.subscriber", "subscriber")
      .where("subscriberSocialMedia.socialMedia = :socialMedia", { socialMedia: socialMediaType.FACEBOOK })
      .andWhere("subscriberSocialMedia.subscriber = :subscriberId", { subscriberId })
      .getOne();

    return subscriberFacebookData;
  } catch (error) {
    console.log("Error while fetching subscriber social media repo", error);
    throw error;
  }
}

export const checkExistingWhatsappConfig = async (userId: number, phoneNoId: string, configId?: number) => {
  try {
    const appDataSource = await getDataSource();
    const SubscriberWhatsappSettingsRepository = appDataSource.getRepository(SubscriberWhatsappSettings);
    const subscriberWhatsappSettingsQueryBuilder = SubscriberWhatsappSettingsRepository.createQueryBuilder("subscriberWhatsapp");
    subscriberWhatsappSettingsQueryBuilder
      .leftJoinAndSelect("subscriberWhatsapp.subscriber", "subscriber")
      .where("subscriber.subscriberId =:subscriberId", {subscriberId: userId})
      .andWhere("subscriberWhatsapp.phoneNoId = :phoneNoId", {phoneNoId});
    
    if(configId) {
      subscriberWhatsappSettingsQueryBuilder.andWhere("subscriberWhatsapp.subWhatsappSettingsId != :id", {id: configId})
    }
    const subscriberWhatsappConfig = await subscriberWhatsappSettingsQueryBuilder.getOne();

    if(subscriberWhatsappConfig) return true;
    else return false;
      
  } catch (error) {
    console.error("Error while checking for existing user whatsapp config!", error)
    throw error;
  }
}