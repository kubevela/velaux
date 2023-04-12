/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  getApplicationList,
  createApplication,
  getApplicationDetails,
  getApplicationStatus,
  getApplicationAllStatus,
  getApplicationComponents,
  getPolicyList,
  getApplicationEnvbinding,
} from '../api/application';
import { getComponentDefinitions } from '../api/definitions';
import { getProjectList } from '../api/project';
import { listWorkflow } from '../api/workflows';

export default {
  namespace: 'application',
  state: {
    applicationList: [],
    applicationDetail: {},
    applicationStatus: {},
    applicationAllStatus: [],
    projectList: [],
    clusterList: [],
    searchAppName: '',
    projects: [],
    components: [],
    componentDefinitions: [],
    componentDetails: {},
    envbinding: [],
    workflows: [],
  },
  reducers: {
    update(state, { type, payload }) {
      return {
        ...state,
        searchAppName: payload,
      };
    },
    updateApplicationList(state, { type, payload }) {
      return {
        ...state,
        applicationList: payload,
      };
    },
    updateApplicationDetail(state, { type, payload }) {
      return {
        ...state,
        applicationDetail: payload,
      };
    },
    updateApplicationEnvbinding(state, { type, payload }) {
      return {
        ...state,
        envbinding: payload.envBindings || [],
      };
    },
    updateApplicationStatus(state, { type, payload }) {
      return {
        ...state,
        applicationStatus: payload.status,
      };
    },
    updateApplicationAllStatus(state, { type, payload }) {
      return {
        ...state,
        applicationAllStatus: payload.status,
      };
    },
    updateComponents(state, { type, payload }) {
      return {
        ...state,
        components: payload.components,
        componentsApp: payload.componentsApp,
      };
    },
    updateProjectList(state, { type, payload }) {
      return {
        ...state,
        projects: payload,
      };
    },
    updatePoliciesList(state, { type, payload }) {
      return {
        ...state,
        policies: payload.policies,
      };
    },
    updateComponentDefinitions(state, { type, payload }) {
      return {
        ...state,
        componentDefinitions: payload,
      };
    },
    updateComponentDetails(state, { type, payload }) {
      return {
        ...state,
        componentDetails: payload,
      };
    },
    updateWorkflow(state, { type, payload }) {
      return {
        ...state,
        workflows: payload || [],
      };
    },
  },
  effects: {
    *getApplicationList(action, { call, put }) {
      const result = yield call(getApplicationList, action.payload);
      yield put({ type: 'updateApplicationList', payload: result ? result.applications : [] });
      if (action.callback) {
        action.callback((result && result.applications) || []);
      }
    },

    *createApplicationPlan(action, { call, put }) {
      const result = yield call(createApplication, action.payload);
      if (action.callback && result) {
        action.callback(result);
      }
    },

    *getProjectList(action, { call, put }) {
      const result = yield call(getProjectList, action.payload);
      if (result) {
        yield put({ type: 'updateProjectList', payload: result.projects });
      }
    },

    *getApplicationDetail(action, { call, put }) {
      const { appName } = action.payload;
      const result = yield call(getApplicationDetails, { name: appName });
      yield put({ type: 'updateApplicationDetail', payload: result });
      if (action.callback && result) {
        action.callback(result);
      }
    },
    *getApplicationEnvbinding(action, { call, put }) {
      const { appName } = action.payload;
      const result = yield call(getApplicationEnvbinding, { appName: appName });
      yield put({ type: 'updateApplicationEnvbinding', payload: result });
      if (action.callback && result) {
        action.callback(result);
      }
    },
    *getApplicationStatus(action, { call, put }) {
      const { appName, envName } = action.payload;
      const result = yield call(getApplicationStatus, { name: appName, envName: envName });
      yield put({ type: 'updateApplicationStatus', payload: result });
      if (action.callback) {
        action.callback(result);
      }
    },
    *getApplicationAllStatus(action, { call, put }) {
      const { appName, envName } = action.payload;
      const result = yield call(getApplicationAllStatus, { name: appName, envName: envName });
      yield put({ type: 'updateApplicationAllStatus', payload: result });
      if (action.callback) {
        action.callback(result);
      }
    },
    *getApplicationComponents(action, { call, put }) {
      const result = yield call(getApplicationComponents, action.payload);
      yield put({
        type: 'updateComponents',
        payload: { components: result && result.components, componentsApp: action.payload.appName },
      });
    },
    *getApplicationPolicies(action, { call, put }) {
      const result = yield call(getPolicyList, action.payload);
      yield put({ type: 'updatePoliciesList', payload: result });
    },
    *getComponentDefinitions(action, { call, put }) {
      const { urlParam } = action.payload;
      const result = yield call(getComponentDefinitions, { envName: urlParam });
      yield put({
        type: 'updateComponentDefinitions',
        payload: result && result.definitions,
      });
    },
    *getApplicationWorkflows(action, { call, put }) {
      const result = yield call(listWorkflow, action.payload);
      yield put({
        type: 'updateWorkflow',
        payload: result.workflows,
      });
    },
  },
};
