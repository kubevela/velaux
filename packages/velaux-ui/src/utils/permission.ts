import type { LoginUserInfo, PermissionBase } from '@velaux/data';

export interface ResourceAction {
  resource: string;
  action: string;
}

export class ResourceName {
  type: string;
  value: string;
  next?: ResourceName;
  constructor(value: string) {
    const index = value.indexOf('/', 1);
    let node = value;
    if (index > -1) {
      node = value.slice(0, index);
    }
    const tn = node.split(':');
    if (tn.length == 2) {
      this.type = tn[0];
      this.value = tn[1];
    } else {
      this.type = tn[0];
      this.value = '*';
    }
    if (index > -1) {
      const nextValue = value.slice(index + 1);
      if (nextValue != '') {
        this.next = new ResourceName(value.slice(index + 1));
      }
    }
  }
}

export function checkPermission(
  request?: ResourceAction,
  project?: string,
  userInfo?: LoginUserInfo,
) {
  if (!request) {
    return true;
  }
  if (!userInfo) {
    return false;
  }

  if (!userInfo.platformPermissions && !userInfo.projectPermissions) {
    return false;
  }
  // check platform permissions
  if (!project) {
    if (!userInfo.platformPermissions || userInfo.platformPermissions.length == 0) {
      return false;
    }
  }

  let permissions = userInfo.platformPermissions || [];

  // check project permissions
  if (project && userInfo.projectPermissions) {
    if (project == '?') {
      Object.keys(userInfo.projectPermissions).map((key) => {
        if (userInfo.projectPermissions) {
          const perms = userInfo.projectPermissions[key];
          if (perms) {
            permissions = permissions.concat(perms);
          }
        }
      });
    } else {
      const userPermissions = userInfo.projectPermissions[project];
      if (userPermissions) {
        permissions = permissions.concat(userPermissions);
      }
    }
  }
  for (let i = 0; i < permissions.length; i++) {
    const effect = permissions[i].effect.toLowerCase();
    if (effect == 'deny' && match(request, permissions[i])) {
      return false;
    }
  }
  for (let i = 0; i < permissions.length; i++) {
    const effect = permissions[i].effect.toLowerCase();
    if ((effect == 'allow' || effect == '') && match(request, permissions[i])) {
      return true;
    }
  }
  return false;
}

export function match(request: ResourceAction, permission: PermissionBase) {
  if (!permission.actions.includes(request.action) && !permission.actions.includes('*')) {
    return false;
  }
  if (!permission.resources?.length) {
    return false;
  }
  for (let i = 0; i < permission.resources?.length; i++) {
    if (
      resourceMatch(new ResourceName(request.resource), new ResourceName(permission.resources[i]))
    ) {
      return true;
    }
  }
  return false;
}

export function resourceMatch(requestResource: ResourceName, permissionResource: ResourceName) {
  let current: undefined | ResourceName = permissionResource;
  let targetCurrent: undefined | ResourceName = requestResource;
  while (current && current.type) {
    if (current.type == '*') {
      return true;
    }
    if (!targetCurrent || !targetCurrent.type) {
      return false;
    }
    if (current.type != targetCurrent.type) {
      return false;
    }
    if (
      current.value != targetCurrent.value &&
      current.value != '*' &&
      targetCurrent.value != '?'
    ) {
      return false;
    }
    current = current.next;
    targetCurrent = targetCurrent.next;
  }
  if (targetCurrent && targetCurrent.type) {
    return false;
  }
  return true;
}
