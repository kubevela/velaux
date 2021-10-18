import axios, {
  AxiosPromise,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
} from 'axios';
import { HttpStatus } from '../api/status';
import { baseURL } from '../api/config';
import qs from 'qs';

interface Params extends AxiosRequestConfig {
  method: Method;
  data?: any;
  parasm?: any;
}

const timing: number = 1000;

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

axios.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    if (config.method === 'get') {
      config.params = {
        timestamp: Date.parse(`${new Date()}`) / timing,
        ...config.params,
      };
    }
    return config;
  },
  (error: any): Promise<any> => {
    return Promise.reject(error.request);
  },
);

axios.interceptors.response.use(
  (response: AxiosResponse<any>): any => {
    if (response.status === 200) {
      return response.data;
    } else {
      throw Error(response.data.msg || 'server error');
    }
  },
  (error: any): Promise<any> => {
    if (error.response.status === HttpStatus.Unauthorized) {
      throw new Error(`${HttpStatus.Unauthorized}`);
    }
    return Promise.reject(error);
  },
);

const request = (url: string, params: Params): AxiosPromise<any> => {
  const options: AxiosRequestConfig = {
    url,
    headers: {
      Accept: 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=UTF-8',
    },
    ...params,
  };

  return axios(options);
};

export default request;
