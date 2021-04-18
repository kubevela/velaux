import { Request, Response } from 'express';
import moment from 'moment';

let clusterList: API.ClusterType[] = [
  {
    name: 'cluster-1',
    desc: 'First cluster',
    updatedAt: moment().valueOf(),
    kubeconfig: 'TODO: kubeconfig data',
  },
  {
    name: 'cluster-2',
    desc: 'Second cluster',
    updatedAt: moment().valueOf(),
    kubeconfig: 'TODO: kubeconfig data',
  },
];
const getClusterNames = (req: Request, res: Response) => {
  res.json({
    clusters: clusterList.map((item) => item.name),
  });
};

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

  let selectedCluster: API.ClusterType = { name: '' };

  switch (method) {
    case 'delete':
      clusterList = clusterList.filter((item) => {
        if (item.name === name) {
          selectedCluster = item;
          return false;
        }
        return true;
      });
      return res.json({ cluster: selectedCluster });

    case 'post':
      const newCluster: API.ClusterType = {
        name,
        desc,
        updatedAt: moment().valueOf(),
        kubeconfig: kubeconfig,
      };
      clusterList.unshift(newCluster);
      return res.json({ cluster: newCluster });

    case 'update':
      clusterList = clusterList.map((item) => {
        if (item.name === name) {
          selectedCluster = {
            ...item,
            desc,
            name,
            kubeconfig,
            updatedAt: moment().valueOf(),
          };
          return selectedCluster;
        }
        return item;
      });
      return res.json({ cluster: selectedCluster });
  }

  const result = {
    clusters: clusterList,
  };

  return res.json(result);
}

export default {
  'GET /api/clusternames': getClusterNames,
  'GET /api/clusters': getClusters,
  'POST /api/clusters': postClusters,
};
