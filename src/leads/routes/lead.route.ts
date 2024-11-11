import express from "express";
import { authUtility } from "../../utils/authUtility";
import { LeadsService } from "../services/lead.service";
const router = express.Router();


const _authUtility = new authUtility();
const leadServices = new LeadsService();

// Lead routes
router.get("/", _authUtility.verifyToken, _authUtility.isSubscriber, leadServices.fetchLeadData);

export default router;