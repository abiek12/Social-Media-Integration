import { Application } from "express";
import express from "express";
const router = express.Router();
import { AuthService } from "../services/auth.service";

const authRoutes = async (app: Application) => {
    const _authService = new AuthService();

    router.post('/', _authService.userLogin);
}

export default authRoutes;