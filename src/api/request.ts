import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import { routerRedux } from 'dva/router';
import { getMessage } from './status';
import { baseURL } from './config';
import { Message } from '@b-design/ui';
import { handleError } from '../utils/errors';
import { getToken } from '../utils/storage';
import store from '../index';
import { authenticationRefreshToken } from './productionLink';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 5000,
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
    const { data, status } = error;
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && data.BusinessCode === '12002') {
      try {
        const res: any = await axios({
          url: `${baseURL}/${authenticationRefreshToken}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('refreshToken', res.refreshToken);
        }
        return axiosInstance(error.config);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        store.dispatch(
          routerRedux.push({
            pathname: '/login',
          }),
        );
        return Promise.reject(err);
      }
    } else {
      localStorage.removeItem('token');
      Message.error(getMessage(status));
    }
  },
);

axiosInstance.interceptors.request.use(
  (config: any) => {
    if (localStorage.getItem('token')) {
      config.headers['Authorization'] = 'Bearer ' + getToken();
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
