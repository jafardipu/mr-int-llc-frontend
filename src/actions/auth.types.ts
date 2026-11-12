export type AuthFlow = "signup" | "reset";

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message: string;
  email?: string;
  flow?: AuthFlow;
};
