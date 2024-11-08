"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const cronJob_1 = require("./utils/cronJob");
const common_1 = require("./utils/common");
const meta_routes_1 = __importDefault(require("./socialMedia/routes/meta.routes"));
const auth_routes_1 = __importDefault(require("./socialMedia/routes/auth.routes"));
const subscriber_route_1 = __importDefault(require("./users/subscriber/routes/subscriber.route"));
const auth_route_1 = __importDefault(require("./users/auth/routes/auth.route"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Express-session setup (required for Passport)
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Routes
app.get('/', (req, res) => {
    res.send('Express server is running!');
});
app.use('/api/v1/meta_auth', auth_routes_1.default);
app.use('/api/v1/meta', meta_routes_1.default);
app.use('/api/v1', subscriber_route_1.default);
app.use('/api/v1/auth', auth_route_1.default);
app.use('/api/v1/subscriber', subscriber_route_1.default);
// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error.stack);
    res.status(common_1.INTERNAL_ERROR).send('Something went wrong!');
});
cronJob_1.cronJob.start();
exports.default = app;
