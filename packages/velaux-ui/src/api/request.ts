import { getBackendSrv, handleAPIError } from '../services/BackendService';

export const post = (url: string, params: any, customError?: boolean) => {
  return getBackendSrv()
    .getAxiosInstance()
    .post(url, params)
    .then((res) => {
      return res && res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError || customError);
    });
};

export const get = (url: string, params: any) => {
  return getBackendSrv()
    .getAxiosInstance()
    .get(url, params)
    .then((res) => {
      return res && res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError);
    });
};

export const rdelete = (url: string, params: any, customError?: boolean) => {
  return getBackendSrv()
    .getAxiosInstance()
    .delete(url, params)
    .then((res) => {
      return res && res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError || customError);
    });
};

export const put = (url: string, params: any, customError?: boolean) => {
  return getBackendSrv()
    .getAxiosInstance()
    .put(url, params)
    .then((res) => {
      return res && res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError || customError);
    });
};
