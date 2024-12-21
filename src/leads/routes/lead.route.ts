import express from "express";
import { authUtility } from "../../utils/authUtility";
import { LeadsService } from "../services/lead.service";
const router = express.Router();

const _authUtility = new authUtility();
const leadServices = new LeadsService();

// Lead routes
router.get("/", _authUtility.verifyToken, _authUtility.isSubscriber, leadServices.fetchLeadData);
router.get("/:id", _authUtility.verifyToken, _authUtility.isSubscriber, leadServices.getSocialMediaLeadById);
router.patch("/:id", _authUtility.verifyToken, _authUtility.isSubscriber, leadServices.updateSocialMediaLead)

export default router;