export type VerifyOTPType = {
  token: string;
  user_id: string;
  message: string;
};
export type UpdatePassType = {
  user_id: number;
};
export type UpdatePassBodyType = {
  user_token: string;
  user_password: string;
};
export type LoginResType = {
  user: {
    _id: string;
    email: string;
    name: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};
