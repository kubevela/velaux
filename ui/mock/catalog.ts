import { Request, Response } from 'express';

let catalogList: API.CatalogType[] = [
  {
    id: 'f430df0d-c76e-400e-ba62-db1098da71b9',
    name: 'test',
    desc: 'First catalog',
    updatedAt: 1612121016,
    url: 'https://github.com/hongchaodeng/catalog-example.git',
    rootdir: 'catalog',
  },
  {
    id: 'd63b41e3-398e-48d5-9b07-e26a519d1075',
    name: 'test-2',
    desc: 'Second catalog',
    updatedAt: 1612121016,
    url: 'https://github.com/hongchaodeng/catalog-example.git',
    rootdir: 'catalog',
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

  return res.json({});
}
export default {
  'GET /api/catalogs': getCatalogs,
  'POST /api/catalogs': postCatalogs,
};
