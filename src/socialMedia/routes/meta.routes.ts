import { metaServices } from "../services/meta.services";
import { authUtility } from "../../utils/authUtility";
import express from "express";
const router = express.Router();

const _metaServices = new metaServices();
const _authUtility = new authUtility();

router.get('/webhook', _metaServices.verifyWebhook);
router.post('/webhook', _metaServices.handleWebhook);

// Fetch facebook pages of the user(subscriber) using meta graph api
router.get('/facebook/fetchPages', _authUtility.verifyToken, _authUtility.isSubscriber, _metaServices.fetchPages);
router.post('/facebook/selectPages', _authUtility.verifyToken, _authUtility.isSubscriber, _metaServices.choosePages);

// check is the user is authenticated with facebook
router.get('/facebook-status', _authUtility.verifyToken, _authUtility.isSubscriber, _metaServices.checkFacebookStatus);

export default router;