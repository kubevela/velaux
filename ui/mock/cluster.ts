import { Request, Response } from 'express';

let clusterList: API.ClusterType[] = [
  {
    name: 'cluster-1',
    desc: 'First cluster',
    updatedAt: 1612121016,
    kubeconfig: 'kubeconfig-1',
  },
  {
    name: 'cluster-2',
    desc: 'Second cluster',
    updatedAt: 1612121016,
    kubeconfig: 'kubeconfig-2',
  },
];

const getClusters = (req: Request, res: Response) => {
  res.json({
    clusters: clusterList,
  });
};

function postClusters(req: Request, res: Response, u: string, b: Request) {
  let requestURL = u;
  if (!requestURL || Object.prototype.toString.call(requestURL) !== '[object String]') {
    requestURL = req.url;
  }

  const body = (b && b.body) || req.body;
  const { method, name, desc, kubeconfig } = body;

  switch (method) {
    case 'delete':
      let selectedCluster: API.ClusterType = { name: '', updatedAt: 0 };
      clusterList = clusterList.filter((item) => {
        if (item.name === name) {
          selectedCluster = item;
          return false;
        }
        return true;
      });
      return res.json({ cluster: selectedCluster });

    case 'post':
      (() => {
        const newCluster: API.ClusterType = {
          name,
          desc,
          updatedAt: new Date().getTime() / 1000,
          kubeconfig: kubeconfig,
        };
        clusterList.unshift(newCluster);
        return res.json({ cluster: newCluster });
      })();
      return;

    case 'update':
      (() => {
        let selectedCluster: API.ClusterType = { name: '', updatedAt: 0 };
        clusterList = clusterList.map((item) => {
          if (item.name === name) {
            selectedCluster = {
              ...item,
              desc,
              name,
              kubeconfig,
              updatedAt: new Date().getTime() / 1000,
            };
            return selectedCluster;
          }
          return item;
        });
        return res.json({ cluster: selectedCluster });
      })();
      return;
    default:
      break;
  }
  const result = {
    clusters: clusterList,
  };

  return res.json(result);
}

export default {
  'GET /api/clusters': getClusters,
  'POST /api/clusters': postClusters,
};
