import type { GroupMappingResponse, UpdateGroupMappingRequest } from '@velaux/data';
import { getDomain } from '../utils/common';

import { groupMappings } from './productionLink';
import { get, put } from './request';

const baseURLObject = getDomain();
const isMock = baseURLObject.MOCK;
const url = isMock ? '/mock/group_mappings' : groupMappings;

export function getGroupMappings() {
  return get(url, {}).then((res: GroupMappingResponse) => res);
}

export function updateGroupMappings(params: UpdateGroupMappingRequest) {
  return put(url, params).then((res: GroupMappingResponse) => res);
}
