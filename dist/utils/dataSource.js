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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataSource = exports.AppDataSourcePromise = void 0;
require("reflect-metadata");
const dbConfig_1 = require("./dbConfig");
function initializeDataSource() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield dbConfig_1.AppDataSource.initialize().then(() => {
                console.log("Database connection established");
            });
            return dbConfig_1.AppDataSource;
        }
        catch (error) {
            console.log("Failed to initialize database connection", error);
            throw error; // Rethrow or handle as needed
        }
    });
}
exports.AppDataSourcePromise = initializeDataSource();
const getDataSource = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (delay = 3000) {
    try {
        const dataSource = yield exports.AppDataSourcePromise;
        return dataSource;
    }
    catch (error) {
        console.log("Database connection error after delay", error);
        throw new Error("Failed to create connection with database");
    }
});
exports.getDataSource = getDataSource;
