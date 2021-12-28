import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { getMessage } from './status';
import { baseURL } from './config';
import { Message } from '@b-design/ui';
import { handleError } from '../utils/errors';

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
    const { response, status } = error;
    if (response) {
      return Promise.reject(response);
    } else {
      Message.error(getMessage(status));
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
