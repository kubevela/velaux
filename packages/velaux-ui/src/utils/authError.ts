// signedOutTitle is the title of the dialog that sends a user back to sign in, naming the
// business code the server ended their session with. A failed token refresh has no code of
// its own, so it reads as an expired refresh token.
export function signedOutTitle(code?: number): string {
  switch (code) {
    case 12013:
      return 'Your session has ended(12013)';
    case 12004:
      return 'The token is invalid(12004)';
    default:
      return 'The token is expired(12010)';
  }
}
