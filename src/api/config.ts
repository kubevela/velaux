import { getDomain } from '../utils/common';
const domainObj = getDomain();
export const baseURL = domainObj.MOCK || domainObj.APIBASE;
