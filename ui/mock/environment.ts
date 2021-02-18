import { Request, Response } from 'express';

let capabilitiList: API.CapabilityType[] = [
  {
    name: 'WebService',
    type: 'Workload',
    jsonschema: '',
  },
  {
    name: 'Routing',
    type: 'Trait',
    jsonschema: '',
  },
];

const getCapabilities = (req: Request, res: Response) => {
  res.json({
    capabilities: capabilitiList,
  });
};
let environmentList: API.EnvironmentType[] = [
  {
    name: 'Environment',
    desc: 'First Environment',
    updatedAt: 1612121016,
  },
  {
    name: 'Environment-2',
    desc: 'Second Environment',
    updatedAt: 1612121016,
  },
];

const getEnvironments = (req: Request, res: Response) => {
  res.json({
    environments: environmentList,
  });
};

function postEnvironments(req: Request, res: Response, u: string, b: Request) {
  let requestURL = u;
  if (!requestURL || Object.prototype.toString.call(requestURL) !== '[object String]') {
    requestURL = req.url;
  }

  const body = (b && b.body) || req.body;
  const { method, name, desc, config, packages, clusters } = body;

  switch (method) {
    case 'delete':
      let selectedEnvironment: API.EnvironmentType = { name: '', updatedAt: 0 };
      environmentList = environmentList.filter((item) => {
        if (item.name === name) {
          selectedEnvironment = item;
          return false;
        }
        return true;
      });
      return res.json({ environment: selectedEnvironment });

    case 'post':
      (() => {
        const newEnvironment: API.EnvironmentType = {
          name,
          desc,
          config,
          packages,
          clusters,
          updatedAt: new Date().getTime() / 1000,
        };
        environmentList.unshift(newEnvironment);
        return res.json({ environment: newEnvironment });
      })();
      return;

    case 'update':
      (() => {
        let selectedEnvironment: API.EnvironmentType = { name: '', updatedAt: 0 };
        environmentList = environmentList.map((item) => {
          if (item.name === name) {
            selectedEnvironment = {
              ...item,
              desc,
              name,
              config,
              packages,
              clusters,
              updatedAt: new Date().getTime() / 1000,
            };
            return selectedEnvironment;
          }
          return item;
        });
        return res.json({ environment: selectedEnvironment });
      })();
      return;
    default:
      break;
  }
  const result = {
    environments: environmentList,
  };

  return res.json(result);
}

export default {
  'GET /api/environments': getEnvironments,
  'GET /api/environments/:env/capabilities': getCapabilities,
  'POST /api/environments': postEnvironments,
};
