import { Request, Response } from 'express';
import moment from 'moment';

let app: API.ApplicationType[] = [
  {
    name: 'app-1',
    desc: 'First app',
    updatedAt: moment().valueOf(),
  },
  {
    name: 'app-2',
    desc: 'Second app',
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
  const { method, name, desc } = body;

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
