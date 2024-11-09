"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = exports.Success = exports.AppException = void 0;
const common_1 = require("./common");
class AppException extends Error {
    constructor(code, message) {
        super();
        this.code = code;
        this.message = message;
    }
}
exports.AppException = AppException;
const Success = (payload) => {
    return {
        success: true,
        payload,
        error: undefined,
    };
};
exports.Success = Success;
const CustomError = (errorCode, errorStr) => {
    if (!errorCode)
        errorCode = common_1.INTERNAL_ERROR;
    if (!errorStr)
        errorStr = common_1.ERROR_COMMON_MESSAGE;
    return {
        success: false,
        payload: undefined,
        errorCode: errorCode,
        errorMessage: errorStr,
    };
};
exports.CustomError = CustomError;
