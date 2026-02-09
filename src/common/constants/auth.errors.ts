export const AuthErrors = {
  USER_NOT_FOUND: "User not found.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_ALREADY_IN_USE: "Email is already in use.",
  INVALID_TOKEN: "Invalid or expired authentication token.",
  INVALID_AUTH0_TOKEN: "Invalid Auth0 authentication token.",
  INVALID_OAUTH_DATA: "Invalid OAuth user data received.",
  USER_ALREADY_EXISTS: "User already exists.",
  EMAIL_NOT_VERIFIED: "Please verify your email before logging in.",
  VERIFICATION_TOKEN_INVALID: "Invalid or expired verification token.",
  RESET_TOKEN_INVALID: "Invalid or expired password reset token.",
} as const;
