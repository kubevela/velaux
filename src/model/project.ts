import { getProjectDetail } from '../api/project';
import type { Project, ProjectDetail } from '../interface/project';

interface projectDetailState {
  projectDetails: ProjectDetail;
}

const project: any = {
  namespace: 'project',
  state: {
    projectDetails: {},
  },
  reducers: {
    updateProjectDetail(state: projectDetailState, { payload }: { payload: Project }) {
      return {
        ...state,
        projectDetails: payload,
      };
    },
  },

  effects: {
    *getProjectDetails(
      action: { payload: { projectName: string } },
      { call, put }: { call: any; put: any },
    ) {
      const result: Project = yield call(getProjectDetail, action.payload);
      yield put({ type: 'updateProjectDetail', payload: result || {} });
    },
  },
};

export default project;
