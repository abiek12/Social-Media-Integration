import express from "express";
import { authUtility } from "../../utils/authUtility";
import { LeadsService } from "../services/lead.service";
const router = express.Router();

const _authUtility = new authUtility();
const leadServices = new LeadsService();

// Social Media Lead routes
router.get("/", _authUtility.verifyToken, _authUtility.isSubscriber, leadServices.fetchLeadData);
router.get("/:id", _authUtility.verifyToken, _authUtility.isSubscriber, leadServices.getSocialMediaLeadById);
router.patch("/:id", _authUtility.verifyToken, _authUtility.isSubscriber, leadServices.updateSocialMediaLead);
router.delete("/:id", _authUtility.verifyToken, _authUtility.isSubscriber, leadServices.deleteSocialMediaLead);

// Convert to actual lead
router.get("/convert/:id", _authUtility.verifyToken, _authUtility.isSubscriber, leadServices.convertToLead);

export default router;