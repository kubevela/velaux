import axios, {
  AxiosPromise,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
} from 'axios';
import { getMessage } from './status';
import { baseURL } from './config';
import { Message } from '@b-design/ui';
import qs from 'qs';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: baseURL,
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

  (error: any) => {
    const { response } = error;
    if (response) {
      return Promise.reject(response.data);
    } else {
      Message.error(getMessage(404));
    }
  },
);

axiosInstance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

export const post = (url: string, params: any) => {
  return axiosInstance
    .post(url, params)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      if (err.BusinessCode) {
        Message.error(`${err.BusinessCode}:${err.Message}`);
      } else {
        Message.error(getMessage(503));
      }
    });
};

export const get = (url: string, params: any) => {
  return axiosInstance
    .get(url, params)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      if (err.BusinessCode) {
        Message.error(`${err.BusinessCode}:${err.Message}`);
      } else {
        Message.error(getMessage(503));
      }
    });
};


export const rdelete = (url: string, params: any) => {
  return axiosInstance
    .delete(url, params)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      if (err.BusinessCode) {
        Message.error(`${err.BusinessCode}:${err.Message}`);
      } else {
        Message.error(getMessage(503));
      }
    });
};
