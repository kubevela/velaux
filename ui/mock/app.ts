import { Request, Response } from 'express';
import moment from 'moment';
import { vela } from '@/services/kubevela/application_pb'

let app: vela.api.model.Application[] = [
  {
    name: 'app-1',
    namespace: 'default',
    desc: 'First app',
    updatedAt: moment().valueOf(),
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
    clusterName: '',
    events: [
      {
        type: 'Warning',
        reason: 'FailedParse',
        age: '3m13s (x7320 over 21h)',
        message: 'Application  component(frontend) parse trait(cpuscaler): LoadTemplate [cpuscaler] : TraitDefinition.core.oam.dev "cpuscaler" not found',
      }
    ],
  },
  {
    name: 'app-2',
    namespace: 'default',
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
    clusterName: '',
    events: [],
    updatedAt: moment().valueOf(),
  },
];

const getApps = (req: Request, res: Response) => {
  res.json({
    applications: app,
  });
};

function postApps(req: Request, res: Response, u: string, b: Request) {
  let requestURL = u;
  if (!requestURL || Object.prototype.toString.call(requestURL) !== '[object String]') {
    requestURL = req.url;
  }

  const body = (b && b.body) || req.body;
  const { method, name, desc, components } = body;

  let selectedApp: vela.api.model.Application = {
    name: '',
    namespace: '',
    desc: '',
    updatedAt: moment().valueOf(),
    components: [],
    clusterName: '',
    events: [],
  };

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
      const newApp: vela.api.model.Application = {
        name: name,
        namespace: 'default',
        desc: desc,
        components: components,
        updatedAt: moment().valueOf(),
        events: [],
        clusterName: '',
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
  'GET /api/clusters/:cluster/applications': getApps,
  'POST /api/clusters/:cluster/applications': postApps,
};
