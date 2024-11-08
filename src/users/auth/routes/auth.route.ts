import { Application } from "express";
import { AuthService } from "../services/auth.service";

const authRoutes = async (app: Application) => {
    const _authService = new AuthService();

    app.post('/subscriber/register', _authService.userLogin);
}

export default authRoutes;