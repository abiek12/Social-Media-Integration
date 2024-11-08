"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authUtility = void 0;
const bcrypt = __importStar(require("bcrypt"));
const common_1 = require("./common");
const response_1 = require("./response");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRoles_enums_1 = require("../users/subscriber/dataModels/enums/userRoles.enums");
class authUtility {
    constructor() {
        // Middleware to verify token
        this.verifyToken = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                let token = req.headers.authorization;
                if (!token) {
                    res.status(common_1.NOT_AUTHORIZED).send((0, response_1.CustomError)(common_1.NOT_AUTHORIZED, "Un-Authorized Access"));
                    return;
                }
                if (token.startsWith("Bearer ")) {
                    token = token.slice(7, token.length).trimLeft();
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
                req.user = decoded;
                next(); // Move to the next middleware or route handler
            }
            catch (error) {
                console.error(`Error in verifyToken: ${error}`);
                res.status(common_1.INTERNAL_ERROR).send((0, response_1.CustomError)(common_1.INTERNAL_ERROR, `Error in token verification.`));
                return;
            }
        });
        // Middleware to check if the user is a subscriber
        this.isSubscriber = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, role } = req.user;
                if (!userId || role !== userRoles_enums_1.userRoles.SUBSCRIBER) {
                    res.status(common_1.FORBIDDEN).send((0, response_1.CustomError)(common_1.FORBIDDEN, "Forbidden"));
                    return;
                }
                next(); // Move to the next middleware or route handler
            }
            catch (error) {
                console.error(`Error in isSubscriber: ${error}`);
                res.status(common_1.FORBIDDEN).send((0, response_1.CustomError)(common_1.FORBIDDEN, "Error in subscriber check"));
                return;
            }
        });
        this.comparePassword = (rawPassword, hashedPassword) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`rawPassword: ${rawPassword}, hashedPassword: ${hashedPassword}`);
                return yield bcrypt.compare(rawPassword, hashedPassword);
            }
            catch (err) {
                console.error(`Error in comparePassword: ${err}`);
                throw err;
            }
        });
        this.generateAccessToken = (userRole, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield jsonwebtoken_1.default.sign({ userId, role: userRole }, process.env.SECRET_KEY, { expiresIn: "1h" });
            }
            catch (err) {
                console.error(`Error in generateAccessToken: ${err}`);
                throw err;
            }
        });
        this.generateRefreshToken = (userRole, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield jsonwebtoken_1.default.sign({ userId, role: userRole }, process.env.SECRET_KEY, { expiresIn: "7d" });
            }
            catch (err) {
                console.error(`Error in generateRefreshToken: ${err}`);
                throw err;
            }
        });
    }
    hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const saltRounds = 10;
                bcrypt.genSalt(saltRounds, (err, salt) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        bcrypt.hash(password, salt, (err, hash) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(hash);
                            }
                        });
                    }
                });
            });
        });
    }
}
exports.authUtility = authUtility;
