import * as api from '@/services/application';

export default function useApplications(params: {}) {
  const listApplications = async () => {
    const { apps } = await api.listApplications();
    return apps;
  };

  const addApplication = async (val: API.ApplicationType) => {
    const { app } = await api.addApplication(val);
    return app;
  };
  const removeApplication = async (val: API.ApplicationType) => {
    const { app } = await api.removeApplication(val);
    return app;
  };
  const updateApplication = async (val: API.ApplicationType) => {
    const { app } = await api.updateApplication(val);
    return app;
  };

  return {
    listApplications,
    addApplication,
    removeApplication,
    updateApplication,
  };
}
