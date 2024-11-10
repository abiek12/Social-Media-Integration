import express from "express";
const router = express.Router();
import { facebookAuthHandler, facebookCallbackHandler } from "../services/socialMediaAuth.service";
import { authUtility } from "../../utils/authUtility";

const _authUtility = new authUtility();

 /* This route will initially calls from the frontend by click on the facebook login button, 
passport.authenticate('facebook') is a middleware used to authenticate the user then it will call the facebook strategy */
router.get('/facebook', _authUtility.verifyToken, _authUtility.isSubscriber, facebookAuthHandler);

/* Callback route for facebook to redirect to passport.authenticate('facebook')
is a middleware which is used to exchange the code with user details then fire callback function */
router.get('/facebook/callback', facebookCallbackHandler);

export default router;