export const getLoginBusinessCode = (status: number | string): string => {
  let message: string = '';
  switch (status) {
    case 12001:
      message = 'The login type is not supported(12001)';
      break;
    case 12002:
      message = 'The token is expired(12002)';
      break;
    case 12003:
      message = 'The token is not valid yet(12003)';
      break;
    case 12004:
      message = 'The token is invalid(12004)';
      break;
    case 12005:
      message = 'The token is malformed(12005)';
      break;
    case 12006:
      message = 'The user is not authorized(12006)';
      break;
    case 12007:
      message = 'The token is not an access token(12007)';
      break;
    case 12008:
      message = 'The login request is invalid(12008)';
      break;
    case 12009:
      message = 'The dex config is invalid(12009)';
      break;
    default:
      message = `Connect error!`;
  }
  return message;
};
