export const getMessage = (status: number | string): string => {
  let message = '';
  switch (status) {
    case 400:
      message = 'BadRequest(400)';
      break;
    case 401:
      message = 'Unauthorized(401)';
      break;
    case 403:
      message = 'Forbidden(403)';
      break;
    case 404:
      message = 'NotFound(404)';
      break;
    case 408:
      message = 'TimeOut(408)';
      break;
    case 500:
      message = 'InternalServerError(500)';
      break;
    case 501:
      message = 'ServerNotImplements(501)';
      break;
    case 502:
      message = 'GatewayError(502)';
      break;
    case 503:
      message = 'InternalServerUnavailable(503)';
      break;
    case 504:
      message = 'GatewayTimeout(504)';
      break;
    default:
      message = `connect error(${status})!`;
  }
  return `${message}, please check the network or contact the administrator!`;
};
