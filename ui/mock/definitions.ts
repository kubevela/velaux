import { Request, Response } from 'express';
import moment from 'moment';

let compDefList: API.ComponentDefinition[] = [
  {
    name: 'webservice',
    desc:
      'Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers.',
  },
  {
    name: 'task',
    desc: 'Describes jobs that run code or a script to completion.',
  },
];

let traitDefList: API.ComponentDefinition[] = [
  {
    name: 'ingress',
    desc:
      'Configures K8s ingress and service to enable web traffic for your service. Please use route trait in cap center for advanced usage.',
  },
  {
    name: 'scaler',
    desc: 'Configures replicas for your service by patch replicas field.',
  },
];
const getComponentDefs = (req: Request, res: Response) => {
  res.json({
    componentDefinitions: compDefList,
  });
};

const getTraitDefs = (req: Request, res: Response) => {
  res.json({
    traitDefinitions: traitDefList,
  });
};
export default {
  'GET /api/clusters/:cluster/componentdefinitions': getComponentDefs,
  'GET /api/clusters/:cluster/traitdefinitions': getTraitDefs,
};
