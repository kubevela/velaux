import { Request, Response } from 'express';

let applicationList: API.ApplicationType[] = [
  {
    name: 'Application',
    desc: 'First Application',
    updatedAt: 1612121016,
  },
  {
    name: 'Application-2',
    desc: 'Second Application',
    updatedAt: 1612121016,
  },
];

const getApplications = (req: Request, res: Response) => {
  res.json({
    apps: applicationList,
  });
};

function postApplications(req: Request, res: Response, u: string, b: Request) {
  let requestURL = u;
  if (!requestURL || Object.prototype.toString.call(requestURL) !== '[object String]') {
    requestURL = req.url;
  }

  const body = (b && b.body) || req.body;
  const { method, name, desc } = body;

  switch (method) {
    case 'delete':
      let selectedApplication: API.ApplicationType = { name: '', updatedAt: 0 };
      applicationList = applicationList.filter((item) => {
        if (item.name === name) {
          selectedApplication = item;
          return false;
        }
        return true;
      });
      return res.json({ app: selectedApplication });

    case 'post':
      (() => {
        const newApplication: API.ApplicationType = {
          name,
          desc,
          updatedAt: new Date().getTime() / 1000,
        };
        applicationList.unshift(newApplication);
        return res.json({ app: newApplication });
      })();
      return;

    case 'update':
      (() => {
        let selectedApplication: API.ApplicationType = { name: '', updatedAt: 0 };
        applicationList = applicationList.map((item) => {
          if (item.name === name) {
            selectedApplication = {
              ...item,
              desc,
              name,
              updatedAt: new Date().getTime() / 1000,
            };
            return selectedApplication;
          }
          return item;
        });
        return res.json({ app: selectedApplication });
      })();
      return;
    default:
      break;
  }
  const result = {
    apps: applicationList,
  };

  return res.json(result);
}

export default {
  'GET /api/applications': getApplications,
  'POST /api/applications': postApplications,
};
