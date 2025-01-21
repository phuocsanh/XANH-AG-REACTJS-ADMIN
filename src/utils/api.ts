import axios, { AxiosInstance, CreateAxiosDefaults } from "axios";
import queryString from "query-string";
import { isFile, isFileArray, isObjectLike } from "./checkType";
import { AnyObject, ApiResponse } from "@/models/common";
import { useAppStore } from "@/stores";

export const URL = "http://localhost:8080";
export const BASE_URL = URL;

export const URL_UPLOAD = BASE_URL + "/media/api/uploads/";

const transformPostFormData = (object: AnyObject | FormData = {}) => {
  if (object instanceof FormData) {
    return object;
  }
  const formData = new FormData();
  for (const [key, value] of Object.entries(object)) {
    if (isObjectLike(value)) {
      if (Array.isArray(value) && isFileArray(value)) {
        value.forEach((v) => {
          formData.append(key, v as unknown as Blob);
        });
      } else if (isFile(value)) {
        formData.append(key, value as unknown as Blob);
      } else {
        formData.append(key, JSON.stringify(value));
      }
    } else if (value != null) {
      formData.append(key, value);
    }
  }
  return formData;
};

const transformPostData = (object: AnyObject = {}) => {
  const newObject: AnyObject = {};
  for (const [key, value] of Object.entries(object)) {
    if (isObjectLike(value)) {
      newObject[key] = JSON.stringify(value);
    } else {
      newObject[key] = value;
    }
  }
  return queryString.stringify(newObject);
};

export class Api {
  instance: AxiosInstance;
  constructor(config?: CreateAxiosDefaults) {
    this.instance = axios.create(config);
  }

  async get<T = void>(
    url: string & (T extends void ? "Bạn chưa khai báo kiểu trả về" : string),
    params?: unknown
  ): Promise<T> {
    const response = await this.instance.get<T>(url, { params });
    return response.data;
  }

  /** form-urlencoded */
  async post<T = ApiResponse>(
    url: string,
    body?: AnyObject,
    params?: unknown
  ): Promise<T> {
    const data = transformPostData(body);
    const response = await this.instance.post<T>(url, data, { params });
    return response.data;
  }

  /** form-data */
  async postForm<T = ApiResponse>(
    url: string,
    body?: AnyObject | FormData,
    params?: unknown
  ): Promise<T> {
    const data = transformPostFormData(body);
    const response = await this.instance.postForm<T>(url, data, { params });
    return response.data;
  }

  /** raw-JSON */
  async postRaw<T = ApiResponse>(
    url: string,
    body?: AnyObject,
    params?: unknown
  ): Promise<T> {
    const data = JSON.stringify(body);
    const response = await this.instance.post<T>(url, data, {
      params,
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  }

  /** form-urlencoded */
  async put<T = ApiResponse>(
    url: string,
    body?: AnyObject,
    params?: unknown
  ): Promise<T> {
    const data = transformPostData(body);
    const response = await this.instance.put<T>(url, data, { params });
    return response.data;
  }

  /** form-data */
  async putForm<T = ApiResponse>(
    url: string,
    body?: AnyObject | FormData,
    params?: unknown
  ): Promise<T> {
    const data = transformPostFormData(body);
    const response = await this.instance.putForm<T>(url, data, { params });
    return response.data;
  }

  /** raw-JSON */
  async putRaw<T = ApiResponse>(
    url: string,
    body?: AnyObject,
    params?: unknown
  ): Promise<T> {
    const data = JSON.stringify(body);
    const response = await this.instance.put<T>(url, data, {
      params,
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  }

  /** form-urlencoded */
  async patch<T = ApiResponse>(
    url: string,
    body?: AnyObject,
    params?: unknown
  ): Promise<T> {
    const data = transformPostData(body);
    const response = await this.instance.patch<T>(url, data, { params });
    return response.data;
  }

  /** form-data */
  async patchForm<T = ApiResponse>(
    url: string,
    body?: AnyObject | FormData,
    params?: unknown
  ): Promise<T> {
    const data = transformPostFormData(body);
    const response = await this.instance.patchForm<T>(url, data, { params });
    return response.data;
  }

  /** raw-JSON */
  async patchRaw<T = ApiResponse>(
    url: string,
    body?: AnyObject,
    params?: unknown
  ): Promise<T> {
    const data = JSON.stringify(body);
    const response = await this.instance.patch<T>(url, data, {
      params,
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  }

  async delete<T = ApiResponse>(url: string, params?: unknown): Promise<T> {
    const response = await this.instance.delete<T>(url, { params });
    return response.data;
  }
}

const api = new Api({ baseURL: BASE_URL, timeout: 30000 });
api.instance.interceptors.request.use(
  (config) => {
    if (import.meta.env.MODE === "development") {
      console.log(
        `%c__REQUEST__${config.url}: %o`,
        "color: blue;font-weight: bold",
        config
      );
    }
    const token = useAppStore.getState().userToken;
    if (token) {
      config.headers.setAuthorization(`Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    throw error;
  }
);

api.instance.interceptors.response.use(
  (response) => {
    if (import.meta.env.MODE === "development") {
      console.log(
        `%c__RESPONSE__${response.config.url}: %o`,
        "color: green;font-weight: bold",
        response
      );
    }
    if (response.data.code && response.data.code !== 200) {
      throw { response };
    }
    return response;
  },
  (error) => {
    if (import.meta.env.MODE === "development") {
      console.log(
        `%c__ERROR__${error.response?.config?.url}: %o`,
        "color: red;font-weight: bold",
        error.response || error
      );
    }
    if (error.response?.status === 401) {
      useAppStore.setState({ userToken: undefined });
    }
    throw error;
  }
);
export default api;
