export interface GroupProjectRoleBase {
  project: string;
  role: string;
}

export interface GroupMappingResponse {
  groups: Record<string, GroupProjectRoleBase[]>;
}

export interface UpdateGroupMappingRequest {
  groups: Record<string, GroupProjectRoleBase[]>;
}
