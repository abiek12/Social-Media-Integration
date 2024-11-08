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
const app_1 = __importDefault(require("./app"));
const common_1 = require("./utils/common");
const ngrok_1 = __importDefault(require("@ngrok/ngrok"));
const cronJob_1 = require("./utils/cronJob");
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        // Start the Express server
        app_1.default.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
            (0, common_1.createAdminUser)();
            cronJob_1.cronJob.start();
            console.log(`Server listening on ${PORT}`);
            // Start ngrok tunnel
            ngrok_1.default.connect({ addr: PORT, authtoken: process.env.NGROK_AUTHTOKEN })
                .then(listener => console.log(`Ingress established at: ${listener.url()}`));
        }));
    }
    catch (error) {
        console.log(`Error starting server: ${error}`);
        process.exit(1);
    }
});
start();
