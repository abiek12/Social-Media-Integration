import { Request, Response } from "express";
import passport from "passport";
import { BAD_REQUEST } from "../../utils/common";
import { CustomError } from "../../utils/response";
import { CLIENT_FAILED_URL, CLIENT_URL } from "../../utils/socialMediaUtility";

export const facebookAuthHandler = async (request: Request, response: Response) => {
  try {
    const subscriberId = (request as any).query.userId;
    if(!subscriberId) {
      console.log("Subscriber is not logged in");
      response.status(BAD_REQUEST).send(CustomError(BAD_REQUEST, "Subscriber is not logged in"));
      return;
    }
    passport.authenticate('facebook', { 
      scope: [
        'public_profile',
        'pages_manage_ads',
        'pages_show_list',
        'pages_read_engagement',
        'leads_retrieval',
        'pages_manage_metadata',
        'instagram_basic',
        'instagram_manage_insights',
        'instagram_manage_comments',
        'whatsapp_business_management',
        'whatsapp_business_messaging'
      ],
      state: subscriberId
    })
  } catch (error) {
    console.log("Error in facebook authentication", error);
    throw error;
  }
}

export const facebookCallbackHandler = async (request: Request, response: Response) => {
  try {
    passport.authenticate('facebook', {
      successRedirect: CLIENT_URL,
      successMessage: "User authenticated facebook successfully",
      failureRedirect: CLIENT_FAILED_URL,
      failureMessage: "User authentication failed!",
    })
  } catch (error) {
    console.log("Error in facebook authentication", error);
    throw error;
  }
}