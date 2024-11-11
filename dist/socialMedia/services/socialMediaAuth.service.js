"use strict";
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
exports.facebookCallbackHandler = void 0;
const passport_1 = __importDefault(require("passport"));
const socialMediaUtility_1 = require("../../utils/socialMediaUtility");
const facebookCallbackHandler = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        passport_1.default.authenticate('facebook', {
            successRedirect: socialMediaUtility_1.CLIENT_URL,
            successMessage: "User authenticated facebook successfully",
            failureRedirect: socialMediaUtility_1.CLIENT_FAILED_URL,
            failureMessage: "User authentication failed!",
        });
    }
    catch (error) {
        console.log("Error in facebook authentication", error);
        throw error;
    }
});
exports.facebookCallbackHandler = facebookCallbackHandler;
