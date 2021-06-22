import {Request, Response} from 'express';
import moment from 'moment';

let catalogList: API.CatalogType[] = [
  {
    name: 'catalog-1',
    desc: 'First catalog',
    updatedAt: moment().valueOf(),
    type: 'github',
    url: 'https://github.com/oam-dev/catalog/tree/master/registry',
    token: 'placeholder',
  },
  {
    name: 'catalog-2',
    desc: 'Second catalog',
    updatedAt: moment().valueOf(),
    type: 'github',
    url: 'https://github.com/oam-dev/catalog/tree/master/registry',
    token: 'placeholder',
  },
];

let capabilityList: API.CatalogCapabilityType[] = [
  {
    name: 'capability-1',
    desc: 'First capability',
    updatedAt: moment().valueOf(),
    catalogName: 'catalog-1',
    type: 'componentDefinition',
    jsonschema: '{}',
  },
  {
    name: 'capability-2',
    desc: 'Second capability',
    updatedAt: moment().valueOf(),
    catalogName: 'catalog-1',
    type: 'componentDefinition',
    jsonschema: '{}',
  },

  {
    name: 'capability-3',
    desc: 'Second capability',
    updatedAt: moment().valueOf(),
    catalogName: 'catalog-1',
    type: 'componentDefinition',
    jsonschema: '{}',
  },
  {
    name: 'capability-4',
    desc: 'Forth capability',
    updatedAt: moment().valueOf(),
    catalogName: 'catalog-1',
    type: 'trait',
    jsonschema: '{}',
  },
  {
    name: 'capability-5',
    desc: 'Fifth capability',
    updatedAt: moment().valueOf(),
    catalogName: 'catalog-1',
    type: 'trait',
    jsonschema: '{}',
  },
  {
    name: 'capability-6',
    desc: 'Sixth capability',
    updatedAt: moment().valueOf(),
    catalogName: 'catalog-1',
    type: 'trait',
    jsonschema: '{}',
  },
];

const getCatalogs = (req: Request, res: Response) => {
  res.json({
    catalogs: catalogList,
  });
};

const installCapability = (req: Request, res: Response) => {
  res.json(true);
};

const getCatalog = (req: Request, res: Response) => {
  const {catalogName} = req.params;
  for (const c in catalogList) {
    const catalog = catalogList[c]
    if (catalog.name === catalogName) {
      res.json({
        catalog: catalog,
      })
      return
    }
  }
  res.json({
    catalog: null,
  });
};

const listCapabilities = (req: Request, res: Response) => {
  const {catalogName} = req.params;
  let capabilities: API.CatalogCapabilityType[] = [];
  for (const c in capabilityList) {
    const capability = capabilityList[c]
    if (capability.catalogName === catalogName) {
      capabilities.push(capability)
    }
  }
  res.json({
    capabilities: capabilities,
  });
};

const syncCatalog = (req: Request, res: Response) => {
  res.json(true);
};

function postCatalogs(req: Request, res: Response, u: string, b: Request) {
  const body = (b && b.body) || req.body;
  const {method, name, desc, type, url, token} = body;

  let selectedCatalog: API.CatalogType = {name: ''};

  switch (method) {
    case 'delete':
      catalogList = catalogList.filter((item) => {
        if (item.name === name) {
          selectedCatalog = item;
          return false;
        }
        return true;
      });
      return res.json({catalog: selectedCatalog});

    case 'post':
      const newCatalog: API.CatalogType = {
        name,
        desc,
        type,
        url,
        token,
        updatedAt: moment().valueOf(),
      };
      catalogList.unshift(newCatalog);
      return res.json({catalog: newCatalog});

    case 'update':
      catalogList = catalogList.map((item) => {
        if (item.name === name) {
          selectedCatalog = {
            ...item,
            desc,
            name,
            type,
            url,
            token,
            updatedAt: moment().valueOf(),
          };
          return selectedCatalog;
        }
        return item;
      });
      return res.json({catalog: selectedCatalog});
  }

  const result = {
    catalogs: catalogList,
  };

  return res.json(result);
}

export default {
  'POST /api/capabilities/:capabilityName/install': installCapability,
  'GET /api/catalogs': getCatalogs,
  'POST /api/catalogs': postCatalogs,
  'GET /api/catalogs/:catalogName': getCatalog,
  'DELETE /api/catalogs/:catalogName': postCatalogs,
  'GET /api/catalogs/:catalogName/capabilities': listCapabilities,
  'POST /api/catalogs/:catalogName/sync': syncCatalog,
};
