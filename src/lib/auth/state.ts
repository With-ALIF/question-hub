export type AuthStatus = "idle" | "error" | "success";

export type AuthState = {
  status: AuthStatus;
  message: string;
};

export const INITIAL_AUTH_STATE: AuthState = {
  status: "idle",
  message: "",
};
