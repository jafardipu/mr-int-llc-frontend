export type AuthFlow = "signup" | "reset";

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message: string;
  email?: string;
  flow?: AuthFlow;
  /** Set on login / sign-up verification: the account must pay its wholesale fee first. */
  wholesaleFeeRequired?: boolean;
};
