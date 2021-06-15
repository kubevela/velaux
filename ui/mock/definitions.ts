import { Request, Response } from 'express';

let compDefList: API.CapabilityType[] = [
  {
    name: 'webservice',
    namespace: 'default',
    desc:
      'Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers.',
    jsonschema: `{
      "$id": "https://example.com/person.schema.json",
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "WebService",
      "type": "object",
      "properties": {
        "image": {
          "type": "string",
          "description": "Container image"
        }
      }
    }`,
  },
  {
    name: 'task',
    namespace: 'default',
    desc: 'Describes jobs that run code or a script to completion.',
    jsonschema: `{
      "$id": "https://example.com/person.schema.json",
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "WebService",
      "type": "object",
      "properties": {
        "image": {
          "type": "string",
          "description": "Container image"
        }
      }
    }`,
  },
];

let traitDefList: API.CapabilityType[] = [
  {
    name: 'ingress',
    namespace: 'default',
    desc:
      'Configures K8s ingress and service to enable web traffic for your service. Please use route trait in cap center for advanced usage.',
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
  {
    name: 'scaler',
    namespace: 'default',
    desc: 'Configures replicas for your service by patch replicas field.',
    jsonschema: `{
      "$id": "https://example.com/arrays.schema.json",
      "$schema": "http://json-schema.org/draft-07/schema#",
      "description": "A representation of a person, company, organization, or place",
      "title": "Routing",
      "properties": {
        "replicas": {
            "default": 1,
            "description": "Replicas of the workload",
            "title": "replicas",
            "type": "integer"
        }
      },
      "required": [
          "replicas"
      ],
      "type": "object"
    }`,
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
