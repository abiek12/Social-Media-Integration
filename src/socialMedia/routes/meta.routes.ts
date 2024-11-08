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
router.post('facebook/selectPage', _metaServices.choosePages);

export default router;