const definitions: any = {
  namespace: 'definitions',
  state: {
    // The tabs of the definitions page, in order; name is the tab's label.
    definitionTypes: [
      { name: 'Components', type: 'component' },
      { name: 'Traits', type: 'trait' },
      { name: 'Policies', type: 'policy' },
      { name: 'Workflow Steps', type: 'workflowstep' },
      { name: 'Sources', type: 'source' },
    ],
  },
  reducers: {},

  effects: {},
};

export default definitions;
