import express from "express";
const router = express.Router();
import { authUtility } from "../../utils/authUtility";
import passport from "passport";
import { CLIENT_FAILED_URL, CLIENT_SUCCESS_URL } from "../../utils/socialMediaUtility";

const _authUtility = new authUtility();

// This route will initially calls from the frontend by click on the facebook login button, 
// passport.authenticate('facebook') is a middleware used to authenticate the user then it will call the facebook strategy
router.get('/facebook', _authUtility.verifyToken, _authUtility.isSubscriber, (req, res, next) => {
    const stateValue = (req as any).user.userId // dynamically pass `state`
    passport.authenticate('facebook', {
      scope: [
        'public_profile',
        'pages_manage_posts',
        'pages_manage_metadata',
        'pages_read_engagement',
        'pages_manage_ads',
        'pages_show_list',
        'pages_manage_engagement',
        'pages_messaging',
        'leads_retrieval',
        'ads_management',
        'instagram_basic',
        'instagram_manage_messages',
        'instagram_manage_insights',
        'instagram_manage_comments',
        'whatsapp_business_management',
        'whatsapp_business_messaging',
      ],
      state: stateValue, // Pass the state dynamically
    })(req, res, next);
  });
  

// Callback route for facebook to redirect to passport.authenticate('facebook')
// is a middleware which is used to exchange the code with user details then fire callback function
router.get('/facebook/callback', (req, res, next) => {
  console.log('Callback Query Params:', req.query); // Log query parameters
  passport.authenticate('facebook', {
    successRedirect: CLIENT_SUCCESS_URL,
    successMessage: "User authenticated facebook successfully",
    failureRedirect: CLIENT_FAILED_URL,
    failureMessage: "User authentication failed!",
  })
});

export default router;