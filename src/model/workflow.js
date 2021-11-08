import _ from 'lodash';
const WORKFLOW_TEMPLATE = {
    appName: '',
    name: '',
    alias: '',
    description: '',
    option: {
        enable: true,
        default: true,
        edit: true,
    },
    data: {
        nodes: {},
        edges: {},
    },
};
export default {
    namespace: 'workflow',
    state: {
        workflowList: [],
    },
    reducers: {
        updateWorkflow(state, { type, payload }) {
            const { workflowList } = payload;
            return {
                ...state,
                workflowList,
            };
        },
    },
    effects: {
        *getWrokflowList(action, { call, put }) {
            yield put({ type: 'getWorkflowList', payload: [] });
        },

        *removeWorkflow(action, { call, put, select }) {
            const { name } = action.payload;
            let { workflowList } = yield select((state) => state.workflow);
            workflowList = workflowList.filter((workflow) => workflow.name !== name);
            yield put({ type: 'updateWorkflow', payload: { workflowList } });
        },

        *setEditView(action, { call, put, select }) {
            const { name, edit } = action.payload;

            let { workflowList } = yield select((state) => state.workflow);

            workflowList = workflowList.map((workflow) => {
                if (workflow.name === name) {
                    workflow.option.edit = edit;
                }
                return workflow;
            });
            yield put({ type: 'updateWorkflow', payload: { workflowList } });
        },

        *addWrokflow(action, { call, put, select }) {
            let { workflowList } = yield select((state) => state.workflow);
            const { appName } = action.payload;
            const newData = _.cloneDeepWith(WORKFLOW_TEMPLATE);
            const name = `app${workflowList.length + 1}`;
            newData.appName = appName;
            newData.name = name;
            newData.alias = name;
            newData.description = 'app description';
            workflowList = workflowList.concat([newData]);
            yield put({ type: 'updateWorkflow', payload: { workflowList } });
        },

        *saveWorkflow(action, { call, put, select }) {
            const originWorkflow = action.payload;
            originWorkflow.option.edit = false;
            const { alias, appName, name, description, option, data } = originWorkflow;
            const workflow = { alias, appName, name, description };
            workflow.enable = option.enable;
            workflow.default = option.default;
            const { nodes } = data;
            const steps = Object.keys(nodes).map((key) => {
                return nodes[key].consumerData;
            })
            workflow.steps = steps;
            const { workflowList } = yield select((state) => state.workflow);
            workflowList.forEach((item) => {
                if (item.name = originWorkflow.name) {
                    item = originWorkflow
                }
            })
            yield put({ type: 'updateWorkflow', payload: { workflowList } });
        }
    },
};
