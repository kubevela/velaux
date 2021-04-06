import { Request, Response } from 'express';

let capabilitiList: API.CapabilityType[] = [
  {
    name: 'WebService',
    type: 'Workload',
    jsonschema: `{
      "$id": "https://example.com/person.schema.json",
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "WebService",
      "type": "object",
      "properties": {
        "image": {
          "type": "string",
          "description": "Container image"
        },
        "port": {
          "type": "string",
          "description": "Expose service port"
        }
      }
    }`,
  },
  {
    name: 'Routing',
    type: 'Trait',
    jsonschema: `{
      "$id": "https://example.com/arrays.schema.json",
      "$schema": "http://json-schema.org/draft-07/schema#",
      "description": "A representation of a person, company, organization, or place",
      "title": "Routing",
      "type": "object",
      "properties": {
        "hosts": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    }`,
  },
];

const getCapabilities = (req: Request, res: Response) => {
  res.json({
    capabilities: capabilitiList,
  });
};

let environmentList: API.EnvironmentType[] = [
  {
    name: 'env-1',
    desc: 'First Environment',
    updatedAt: 1612121016,
  },
  {
    name: 'env-2',
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
