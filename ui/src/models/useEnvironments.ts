import * as api from '@/services/environment';

export default function useEnvironments(params: {}) {
  const listEnvironments = async () => {
    const { environments } = await api.listEnvironments();
    return environments;
  };

  const addEnvironment = async (val: API.EnvironmentType) => {
    const { environment } = await api.addEnvironment(val);
    return environment;
  };
  const removeEnvironment = async (val: API.EnvironmentType) => {
    const { environment } = await api.removeEnvironment(val);
    return environment;
  };
  const updateEnvironment = async (val: API.EnvironmentType) => {
    const { environment } = await api.updateEnvironment(val);
    return environment;
  };

  const listCapabilities = async (envName: string) => {
    const { capabilities } = await api.listCapabilities(envName);
    return capabilities;
  };

  return {
    listEnvironments,
    addEnvironment,
    removeEnvironment,
    updateEnvironment,
    listCapabilities,
  };
}
