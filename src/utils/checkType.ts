/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosResponse, isAxiosError } from "axios";
import { AnyObject, ApiResponse, UploadFile } from "@/models/common";

export const isObjectLike = (params: unknown): params is object => {
  return params != null && typeof params === "object";
};

export const isFileArray = (arr: unknown[]): arr is UploadFile[] => {
  return isFile(arr[0]);
};

export const isFile = (params: unknown): params is UploadFile => {
  const _params = params as any;
  return !!(_params?.uri && _params?.type && _params?.name);
};

export const isApiResponse = (params: unknown): params is ApiResponse => {
  const _params = params as any;
  return !!(_params?.code && _params?.message);
};

export const isAppAxiosError = isAxiosError<
  ApiResponse & {
    data?: AnyObject;
  }
>;

export const errorHasResponse = (
  err: unknown
): err is {
  response: AxiosResponse<
    ApiResponse & {
      data?: AnyObject;
    }
  >;
} => {
  const _err = err as any;
  return !!_err?.response;
};

const isStringArray = (params: unknown): params is string[] => {
  return Array.isArray(params) && typeof params[0] === "string";
};

export const isMessageErrorObject = (
  params: unknown
): params is { [key: string]: string[] } => {
  return isObjectLike(params) && isStringArray(Object.values(params)[0]);
};

export const isGoongError = (
  err: unknown
): err is {
  response: { data: { error: { code: string; message: string } } };
} => {
  const _err = err as any;
  return !!(
    _err?.response?.data?.error?.code && _err?.response?.data?.error?.message
  );
};
