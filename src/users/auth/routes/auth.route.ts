import express from "express";
const router = express.Router();
import { AuthService } from "../services/auth.service";

const _authService = new AuthService();
router.post('/', _authService.userLogin);

export default router;