import { Request, Response } from 'express';
import moment from 'moment';

let app: API.ApplicationType[] = [
  {
    name: 'app-1',
    desc: 'First app',
    components: [
      {
        name: 'frontend',
        namespace: 'default',
        workload: 'deployments.apps',
        desc: 'Describes long-running, scalable, containerized services that have a stable network ' +
          'endpoint to receive external network traffic from customers.',
        type: 'webservice',
        phase: 'running',
        health: true,
        traits: [{
          type: 'cpuscaler',
          desc: 'Configures K8s ingress and service to enable web traffic for your service.Please use route trait in cap center for advanced usage.',
        }, {
          type: 'sidecar',
          desc: 'Configures replicas for your service.',
        }]
      },
      {
        name: 'backend',
        namespace: 'default',
        workload: 'deployments.apps',
        desc: 'Describes long-running, scalable, containerized services that have a stable network ' +
          'endpoint to receive external network traffic from customers.',
        type: 'worker',
        phase: 'rendering',
        health: false,
        traits: [],
      }],
    updatedAt: moment().valueOf(),
  },
  {
    name: 'app-2',
    desc: 'Second app',
    components: [
      {
        name: 'frontend',
        namespace: 'default',
        workload: 'deployments.apps',
        desc: 'Describes long-running, scalable, containerized services that have a stable network ' +
          'endpoint to receive external network traffic from customers.',
        type: 'webservice',
        phase: 'rendering',
        health: false,
        traits: [{
          type: 'cpuscaler',
          desc: 'Configures K8s ingress and service to enable web traffic for your service.Please use route trait in cap center for advanced usage.',
        }, {
          type: 'sidecar',
          desc: 'Configures replicas for your service.',
        }]
      },
      {
        name: 'backend',
        namespace: 'default',
        workload: 'deployments.apps',
        desc: 'Describes long-running, scalable, containerized services that have a stable network ' +
          'endpoint to receive external network traffic from customers.',
        type: 'worker',
        phase: 'rendering',
        health: false,
        traits: [],
      }],
    updatedAt: moment().valueOf(),
  },
];

let appDetail: API.ApplicationDetailType =
    {
      name: 'app-1',
      desc: 'First app',
      components: [
        {
          name: 'frontend',
          namespace: 'default',
          workload: 'deployments.apps',
          desc: 'Describes long-running, scalable, containerized services that have a stable network ' +
            'endpoint to receive external network traffic from customers.',
          type: 'webservice',
          phase: 'running',
          health: true,
          traits: [{
            type: 'cpuscaler',
            desc: 'Configures K8s ingress and service to enable web traffic for your service.Please use route trait in cap center for advanced usage.',
          }, {
            type: 'sidecar',
            desc: 'Configures replicas for your service.',
          }]
        },
        {
          name: 'backend',
          namespace: 'default',
          workload: 'deployments.apps',
          desc: 'Describes long-running, scalable, containerized services that have a stable network ' +
            'endpoint to receive external network traffic from customers.',
          type: 'worker',
          phase: 'rendering',
          health: false,
          traits: [],
        }],
      events: [
        {
          type: 'Normal',
          reason: 'FailedParse',
          age: '3m13s (x7320 over 21h)',
          message: 'Application  component(frontend) parse trait(cpuscaler): LoadTemplate [cpuscaler] : TraitDefinition.core.oam.dev "cpuscaler" not found',
        },
        {
          type: 'Warning',
          reason: 'FailedParse',
          age: '3m13s (x7320 over 21h)',
          message: 'Application  component(frontend) parse trait(cpuscaler): LoadTemplate [cpuscaler] : TraitDefinition.core.oam.dev "cpuscaler" not found',
        },
        {
          type: 'Other',
          reason: 'FailedParse',
          age: '3m13s (x7320 over 21h)',
          message: 'Application  component(frontend) parse trait(cpuscaler): LoadTemplate [cpuscaler] : TraitDefinition.core.oam.dev "cpuscaler" not found',
        }
      ],
      updatedAt: moment().valueOf(),
    };

const listApps = (req: Request, res: Response) => {
  res.json({
    applications: app,
  });
};

const getApp = (req: Request, res: Response) => {
  res.json({
    application: appDetail,
  });
};

function postApps(req: Request, res: Response, u: string, b: Request) {
  let requestURL = u;
  if (!requestURL || Object.prototype.toString.call(requestURL) !== '[object String]') {
    requestURL = req.url;
  }

  const body = (b && b.body) || req.body;
  const { method, name, desc, components } = body;

  let selectedApp: API.ApplicationType = { name: '' };

  switch (method) {
    case 'delete':
      app = app.filter((item) => {
        if (item.name === name) {
          selectedApp = item;
          return false;
        }
        return true;
      });
      return res.json({ application: selectedApp });

    case 'post':
      const newApp: API.ApplicationType = {
        name,
        desc,
        components,
        updatedAt: moment().valueOf(),
      };
      app.unshift(newApp);
      return res.json({ application: newApp });

    case 'update':
      app = app.map((item) => {
        if (item.name === name) {
          selectedApp = {
            ...item,
            desc,
            name,
            components,
            updatedAt: moment().valueOf(),
          };
          return selectedApp;
        }
        return item;
      });
      return res.json({ application: selectedApp });
  }

  const result = {
    applications: app,
  };

  return res.json(result);
}

export default {
  'GET /api/clusters/:cluster/applications': listApps,
  'GET /api/clusters/:cluster/applications/:appName': getApp,
  'POST /api/clusters/:cluster/applications': postApps,
  'POST /api/clusters/:cluster/appYaml': postApps,
};
