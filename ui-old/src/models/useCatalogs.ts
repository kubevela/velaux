import * as api from '@/services/catalog';

export default function useCatalogs(params: {}) {
  const listCatalogs = async () => {
    const { catalogs } = await api.listCatalogs();
    return catalogs;
  };

  const addCatalog = async (val: API.CatalogType) => {
    return api.addCatalog(val);
  };
  const removeCatalog = async (val: API.CatalogType) => {
    return api.removeCatalog(val);
  };
  const updateCatalog = async (val: API.CatalogType) => {
    return api.updateCatalog(val);
  };

  return {
    listCatalogs,
    addCatalog,
    removeCatalog,
    updateCatalog,
  };
}
