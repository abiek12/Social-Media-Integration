import { ERROR_COMMON_MESSAGE, INTERNAL_ERROR } from "./common";

export class AppException extends Error {
  code: number;
  message: string;

  constructor(code: number, message: string) {
    super();
    this.code = code;
    this.message = message;
  }
}

export const Success = <T>(payload: T) => {
  return {
    success: true,
    payload,
    error: undefined,
  };
};

export const CustomError = <T>(errorCode?: number, errorStr?: string | Object) => {
  if (!errorCode) errorCode = INTERNAL_ERROR;
  if (!errorStr) errorStr = ERROR_COMMON_MESSAGE;

  return {
    success: false,
    payload: undefined,
    errorCode: errorCode,
    errorMessage: errorStr,
  };
};
