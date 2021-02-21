import { Request, Response } from 'express';

let catalogList: API.CatalogType[] = [
  {
    id: 'f430df0d-c76e-400e-ba62-db1098da71b9',
    name: 'catalog-1',
    desc: 'First catalog',
    updatedAt: 1612121016,
    url: 'https://github.com/hongchaodeng/catalog-example.git',
    rootdir: 'catalog',
  },
  {
    id: 'd63b41e3-398e-48d5-9b07-e26a519d1075',
    name: 'catalog-2',
    desc: 'Second catalog',
    updatedAt: 1612121016,
    url: 'https://github.com/hongchaodeng/catalog-example.git',
    rootdir: 'catalog',
  },
];

let packageList: API.PackageType[] = [
  {
    name: 'pkg-1',
    description: 'First package',
    labels: ['helm', 'autoscaling', 'lightweight', 'cloud-native'],
    versions: [{ version: 'v1' }, { version: 'v2' }],
  },
];

const getCatalogs = (req: Request, res: Response) => {
  res.json({
    catalogs: catalogList,
  });
};

function postCatalogs(req: Request, res: Response, u: string, b: Request) {
  let requestURL = u;
  if (!requestURL || Object.prototype.toString.call(requestURL) !== '[object String]') {
    requestURL = req.url;
  }

  const body = (b && b.body) || req.body;
  const { method, name, desc, url, rootdir } = body;

  switch (method) {
    case 'delete':
      let selectedCatalog: API.CatalogType = { name: '', updatedAt: 0 };
      catalogList = catalogList.filter((item) => {
        if (item.name === name) {
          selectedCatalog = item;
          return false;
        }
        return true;
      });
      return res.json(selectedCatalog);
    case 'post':
      (() => {
        const newCatalog: API.CatalogType = {
          name,
          desc,
          url,
          rootdir,
          updatedAt: new Date().getTime() / 1000,
        };
        catalogList.unshift(newCatalog);
        return res.json(newCatalog);
      })();
      return;

    case 'update':
      (() => {
        let selectedCatalog: API.CatalogType = { name: '', updatedAt: 0 };
        catalogList = catalogList.map((item) => {
          if (item.name === name) {
            selectedCatalog = {
              ...item,
              desc,
              name,
              url,
              rootdir,
              updatedAt: new Date().getTime() / 1000,
            };
            return selectedCatalog;
          }
          return item;
        });
        return res.json(selectedCatalog);
      })();
      return;
    default:
      break;
  }
  const result = {
    catalogs: catalogList,
  };

  return res.json(result);
}

const getPackages = (req: Request, res: Response) => {
  res.json({
    packages: packageList,
  });
};

export default {
  'GET /api/catalogs': getCatalogs,
  'GET /api/catalogs/:name': getPackages,
  'POST /api/catalogs': postCatalogs,
};
