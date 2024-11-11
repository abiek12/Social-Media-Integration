import { Request, Response } from "express";
import passport from "passport";
import { CLIENT_FAILED_URL, CLIENT_URL } from "../../utils/socialMediaUtility";

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