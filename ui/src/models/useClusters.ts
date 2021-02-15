import * as api from '@/services/cluster';

export default function useClusters(params: {}) {
  const listClusters = async () => {
    const { clusters } = await api.listClusters();
    return clusters;
  };

  const addCluster = async (val: API.ClusterType) => {
    const { cluster } = await api.addCluster(val);
    return cluster;
  };
  const removeCluster = async (val: API.ClusterType) => {
    const { cluster } = await api.removeCluster(val);
    return cluster;
  };
  const updateCluster = async (val: API.ClusterType) => {
    const { cluster } = await api.updateCluster(val);
    return cluster;
  };

  return {
    listClusters,
    addCluster,
    removeCluster,
    updateCluster,
  };
}
