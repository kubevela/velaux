import axios, { AxiosPromise, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { HttpStatus } from '../api/status';

interface Params extends AxiosRequestConfig {
  method: Method;
  data?: any;
  parasm?: any;
}

const timing: number = 1000;

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
    return response.data;
  },
  (error: any): Promise<any> => {
    if (error.response.status === HttpStatus.Unauthorized) {
      throw new Error(`${HttpStatus.Unauthorized}`);
    }
    return Promise.reject(error.response);
  },
);

const request = (url: string, params: Params): AxiosPromise<any> => {
  const options: AxiosRequestConfig = {
    url,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    ...params,
  };

  return axios(options);
};

export default request;
