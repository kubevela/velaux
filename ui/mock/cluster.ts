import { Request, Response } from 'express';
import moment from 'moment';
import { vela } from '@/services/kubevela/cluster_pb';


let clusterList: vela.api.model.Cluster[] = [
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

  let selectedCluster: vela.api.model.Cluster = {
    name: '',
    desc: '',
    updatedAt: moment().valueOf(),
    kubeconfig: '',
  };

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
      const newCluster: vela.api.model.Cluster = {
        name: name,
        desc: desc,
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
            name: name,
            desc: desc,
            updatedAt: moment().valueOf(),
            kubeconfig: kubeconfig,
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

const checkVelaInstalled = (req: Request, res: Response) => {
  res.json({
    installed: true,
  });
};


const installVelaController = (req: Request, res: Response) => {
  res.json({
    version: '',
  });
};

export default {
  'GET /api/clusternames': getClusterNames,
  'GET /api/clusters': getClusters,
  'POST /api/clusters': postClusters,
  'GET /api/clusters/:cluster/isvelainstalled': checkVelaInstalled,
  'GET /api/clusters/:cluster/installvela': installVelaController,
};
