import _ from 'loadsh';
const WORKFLOW_TEMPLATE = {
    appName: "",
    name: "",
    alias: "",
    description: "",
    option: {
        enable: true,
        default: true,
        edit: true,
    },
    data: {
        nodes: {
        },
        edges: {
        },
    },
}
export default {
    namespace: "workflow",
    state: {
        workflowList: [
            {
                appName: "APP-0",
                name: "appplanName",
                alias: "工作流",
                description: "工作流描述",
                option: {
                    enable: true,
                    default: true,
                    edit: false,
                },
                data: {
                    nodes: {
                        a1: {
                            id: "a1",
                            diagramMakerData: {
                                position: {
                                    x: 20,
                                    y: 130,
                                },
                                size: {
                                    width: 160,
                                    height: 40,
                                },
                            },
                            consumerData: {
                                text: "部署到开发环境",
                                id: "1",
                            },
                            typeId: "start",
                        },
                        a2: {
                            id: "a2",
                            diagramMakerData: {
                                position: {
                                    x: 320,
                                    y: 130,
                                },
                                size: {
                                    width: 160,
                                    height: 40,
                                },
                            },

                            consumerData: {
                                text: "部署到预发环境",
                                id: "2",
                            },
                        },
                        a3: {
                            id: "a3",
                            diagramMakerData: {
                                position: {
                                    x: 620,
                                    y: 130,
                                },
                                size: {
                                    width: 160,
                                    height: 40,
                                },
                            },
                            consumerData: {
                                text: "人工审核",
                                id: "22",
                            },
                        },
                        a4: {
                            id: "a4",
                            diagramMakerData: {
                                position: {
                                    x: 920,
                                    y: 130,
                                },
                                size: {
                                    width: 160 + 60,
                                    height: 40,
                                },
                            },
                            typeId: "end",
                            consumerData: {
                                text: "金丝雀发布到生产环境",
                                id: "24",
                            },
                        },
                    },
                    edges: {
                        edge1: {
                            id: "edge1",
                            src: "a1",
                            dest: "a2",
                            diagramMakerData: {},
                        },
                        edge2: {
                            id: "edge2",
                            src: "a2",
                            dest: "a3",
                            diagramMakerData: {},
                        },
                        edge3: {
                            id: "edge3",
                            src: "a3",
                            dest: "a4",
                            diagramMakerData: {},
                        },
                    },
                },
            },
        ],
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
            // const result = yield call(getAddonsList, action.payload);
            yield put({ type: "getWorkflowList", payload: [] });
        },

        *removeWorkflow(action, { call, put, select }) {
            const { appName } = action.payload;
            let { workflowList } = yield select((state) => state.workflow);
            workflowList = workflowList.filter((workflow) =>
                workflow.appName !== appName
            );
            yield put({ type: "updateWorkflow", payload: { workflowList } });
        },

        *setEditView(action, { call, put, select }) {
            const { appName, edit } = action.payload;

            let { workflowList } = yield select((state) => state.workflow);

            workflowList = workflowList.map((workflow) => {
                if (workflow.appName === appName) {
                    workflow.option.edit = edit;
                }
                return workflow;
            });
            yield put({ type: "updateWorkflow", payload: { workflowList } });
        },

        *addWrokflow(action, { call, put, select }) {
            let { workflowList } = yield select((state) => state.workflow);
            const newData = _.cloneDeepWith(WORKFLOW_TEMPLATE);
            const appName = `APP-${workflowList.length + 1}`;
            newData.appName = appName
            newData.name = appName;
            newData.alias = 'alias';
            newData.description = 'app description';
            workflowList = workflowList.concat([newData])
            yield put({ type: "updateWorkflow", payload: { workflowList } });
        }
    },
};
