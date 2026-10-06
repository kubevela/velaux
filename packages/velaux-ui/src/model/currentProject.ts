import { allProjects, projectKey } from '../utils/currentProject';

// project is the project every view is scoped to; allProjects is all of them.
const currentProject: any = {
  namespace: 'currentProject',
  state: {
    current: allProjects,
    resolved: false,
  },
  reducers: {
    setProject(state: any, { payload }: { payload: string }) {
      try {
        localStorage.setItem(projectKey, payload);
      } catch (e) {
        // A browser that keeps nothing still scopes this session.
      }
      return { ...state, current: payload, resolved: true };
    },
  },
};

export default currentProject;
