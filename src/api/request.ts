import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import { getMessage } from './status';
import { baseURL } from './config';
import { Message } from '@b-design/ui';
import { handleError } from '../utils/errors';
import { getToken } from '../utils/storage';
import { authenticationRefreshToken } from './productionLink';
import ResetLogin from '../utils/resetLogin';

type RetryRequests = (token: string) => void;
let isRefreshing = false;
let retryRequests: RetryRequests[] = [];

export const axiosInstance: AxiosInstance = axios.create({
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

axiosInstance.interceptors.response.use(
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
              return axiosInstance(config);
            }
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
            config.headers['Authorization'] = 'Bearer ' + token;
            resolve(axiosInstance(config));
          });
        });
      }
    } else if (data.BusinessCode === 12010) {
      return ResetLogin.getInstance().reset;
    } else {
      return Promise.reject(error.response || error);
    }
  },
);

axiosInstance.interceptors.request.use(
  (config: any) => {
    if (getToken()) {
      config.headers.Authorization = 'Bearer ' + getToken();
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

const handleAPIError = (err: any, customError: boolean) => {
  const { data, status } = err;
  if (customError) {
    throw data;
  } else if (data && data.BusinessCode) {
    handleError(data);
  } else {
    Message.error(getMessage(status));
  }
};

export const post = (url: string, params: any, customError?: boolean) => {
  return axiosInstance
    .post(url, params)
    .then((res) => {
      return res && res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError || customError);
    });
};

export const get = (url: string, params: any) => {
  return axiosInstance
    .get(url, params)
    .then((res) => {
      return res && res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError);
    });
};

export const rdelete = (url: string, params: any) => {
  return axiosInstance
    .delete(url, params)
    .then((res) => {
      return res && res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError);
    });
};

export const put = (url: string, params: any, customError?: boolean) => {
  return axiosInstance
    .put(url, params)
    .then((res) => {
      return res && res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError || customError);
    });
};

async function getRefreshTokenFunc() {
  const refreshToken = localStorage.getItem('refreshToken') || '';
  return await axios({
    url: `${baseURL}${authenticationRefreshToken}`,
    method: 'GET',
    headers: {
      RefreshToken: refreshToken,
    },
  });
}
