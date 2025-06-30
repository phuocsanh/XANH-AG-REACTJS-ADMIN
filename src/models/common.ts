enum Role {
  ADMIN = "admin",
  CUSTOMMER = "custommer",
}
export const RoleValues = [Role.ADMIN, Role.CUSTOMMER] as const;

export enum API_CODE {
  SUCCESS = 200,
  FAILURE = 400,
}
export type ApiResponse = {
  code: number;
  message: string;
};

export type ResponseData<D> = ApiResponse & {
  data: D;
};
export type ApiResponseError = {
  status: number;
  statusText: string;
};

type Paging = {
  p?: number;
  limit?: number;
};

export type PagingParams<P = void> = P extends void
  ? Paging | void
  : Paging & P;

export type PagingResponseData<D> = ApiResponse & {
  data: {
    currentPage: number;
    totalPages: number;
    total: number;
    data: D[];
  };
};

export type Timeout = ReturnType<typeof setTimeout>;

export type Interval = ReturnType<typeof setInterval>;
export type AnyObject = { [key: string]: unknown };
export type UploadFile = {
  uri: string;
  name: string;
  type: string;
};
