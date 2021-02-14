import { useState } from 'react';
import * as api from '@/services/catalog';

interface State {
  catalogs?: API.CatalogType[];
}

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

  return {
    listCatalogs,
    addCatalog,
    removeCatalog,
  };
}
