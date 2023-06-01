import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import { Message } from '@alifd/next';
import { getDomain } from '../utils/common';
import { getMessage } from '../api/status';
import ResetLogin from '../utils/resetLogin';
import { getToken } from '../utils/storage';
import { handleError } from '../utils/errors';

const domainObj = getDomain();
let baseURL = domainObj.APIBASE;
type RetryRequests = (token: string) => void;
let isRefreshing = false;
let retryRequests: RetryRequests[] = [];

export const handleAPIError = (err: any, customError: boolean) => {
  const { data, status } = err;
  if (customError) {
    throw data;
  } else if (data && data.BusinessCode) {
    handleError(data);
  } else {
    Message.error(getMessage(status));
  }
};

async function getRefreshTokenFunc() {
  const refreshToken = localStorage.getItem('refreshToken') || '';
  return await axios({
    url: `${baseURL}/api/v1/auth/refresh_token`,
    method: 'GET',
    headers: {
      RefreshToken: refreshToken,
    },
  });
}

export interface BackendSrv {
  getAxiosInstance: () => AxiosInstance;

  post<R, P>(url: string, params?: P, customError?: boolean): Promise<R>;

  get<R, P>(url: string, params?: P, customError?: boolean): Promise<R>;

  delete<R, P>(url: string, params?: P, customError?: boolean): Promise<R>;

  put<R, P>(url: string, params?: P, customError?: boolean): Promise<R>;
}

/** @internal */
export class BackendWrapper implements BackendSrv {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: baseURL,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      transformRequest: [
        function (data) {
          return JSON.stringify(data);
        },
      ],
    });

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (response.status === 200) {
          return response;
        } else {
          Message.show(getMessage(response.status));
          return response;
        }
      },

      async (error: any) => {
        if (!error.response) {
          return Promise.reject(error);
        }
        const { data, config } = error.response;
        if (data.BusinessCode === 12002) {
          if (!isRefreshing) {
            isRefreshing = true;
            return getRefreshTokenFunc()
              .then((res: any) => {
                const refreshData = res && res.data;
                if (refreshData && refreshData.accessToken) {
                  localStorage.setItem('token', refreshData.accessToken);
                  localStorage.setItem('refreshToken', refreshData.refreshToken);
                  config.headers.Authorization = 'Bearer ' + getToken();
                  retryRequests.forEach((cb) => {
                    cb(getToken());
                  });
                  retryRequests = [];
                  return this.axiosInstance(config);
                }
                return null;
              })
              .catch(() => {
                return ResetLogin.getInstance().reset;
              })
              .finally(() => {
                isRefreshing = false;
              });
          } else {
            return new Promise((resolve) => {
              retryRequests.push((token: string) => {
                config.headers.Authorization = 'Bearer ' + token;
                resolve(this.axiosInstance(config));
              });
            });
          }
        } else if (data.BusinessCode === 12010 || data.BusinessCode === 12004) {
          return ResetLogin.getInstance().reset;
        } else {
          return Promise.reject(error.response || error);
        }
      }
    );

    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        if (getToken()) {
          config.headers.Authorization = 'Bearer ' + getToken();
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  post(url: string, params?: any, customError?: boolean) {
    return this.axiosInstance
      .post(baseURL + url, params)
      .then((res) => {
        return res && res.data;
      })
      .catch((err) => {
        handleAPIError(err, params.customError || customError);
      });
  }

  get(url: string, params?: any, customError?: boolean) {
    return this.axiosInstance
      .get(baseURL + url, params)
      .then((res) => {
        return res && res.data;
      })
      .catch((err) => {
        handleAPIError(err, params.customError || customError);
      });
  }

  delete(url: string, params?: any, customError?: boolean) {
    return this.axiosInstance
      .delete(baseURL + url, params)
      .then((res) => {
        return res && res.data;
      })
      .catch((err) => {
        handleAPIError(err, params.customError || customError);
      });
  }

  put(url: string, params?: any, customError?: boolean) {
    return this.axiosInstance
      .put(baseURL + url, params)
      .then((res) => {
        return res && res.data;
      })
      .catch((err) => {
        handleAPIError(err, params.customError || customError);
      });
  }
}

/**
 * @private
 */
let pluginService: BackendSrv = new BackendWrapper();

/**
 * Used to retrieve the {@link BackendSrv} that can be used to communicate
 *
 * @public
 */
export const getBackendSrv = (): BackendSrv => pluginService;
