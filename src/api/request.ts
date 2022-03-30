import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import { getMessage } from './status';
import { baseURL } from './config';
import { Message } from '@b-design/ui';
import { handleError } from '../utils/errors';
import { getToken } from '../utils/storage';
import { authenticationRefreshToken } from './productionLink';

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
    const { data, status } = error?.response;
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && data.BusinessCode === '12002') {
      try {
        const res: any = await axios({
          url: `${baseURL}/${authenticationRefreshToken}`,
          method: 'GET',
          headers: {
            RefreshToken: refreshToken,
          },
        });
        if (res && res.accessToken) {
          localStorage.setItem('token', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
        } else {
          window.location.href = '/login';
        }
        return axiosInstance(error.config);
      } catch (err: any) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err.response || err);
      }
    } else {
      switch (status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
      }
      Message.error(getMessage(status));
      return Promise.reject(error.response || error);
    }
  },
);

axiosInstance.interceptors.request.use(
  (config: any) => {
    if (localStorage.getItem('token')) {
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
      return res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError || customError);
      return Promise.reject(err.response || err);
    });
};

export const get = (url: string, params: any) => {
  return axiosInstance
    .get(url, params)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError);
    });
};

export const rdelete = (url: string, params: any) => {
  return axiosInstance
    .delete(url, params)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError);
    });
};

export const put = (url: string, params: any) => {
  return axiosInstance
    .put(url, params)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      handleAPIError(err, params.customError);
    });
};
