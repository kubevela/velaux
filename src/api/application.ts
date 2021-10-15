import request from "../request";
import { applicationList_dev } from './devLink';
import { applicationList } from './productionLink';
import { isDEVEnvironment } from '../utils/common';
export function getApplicationList(params: any) {
    const url = isDEVEnvironment() ? applicationList_dev : applicationList;
    return request(url, params).then(res => {
        return res;
    }).catch(
        err => err
    )
}