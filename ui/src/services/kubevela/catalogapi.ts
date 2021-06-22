import {request} from 'umi';

export async function listCatalogs() {
  return request<{ catalogs: API.CatalogType[] }>('/api/catalogs');
}

export async function getCatalog(catalogName: string) {
  return request<{ catalog: API.CatalogType }>(`/api/catalogs/${catalogName}`);
}

export async function syncCatalog(catalogName: string) {
  return request<boolean>(`/api/catalogs/${catalogName}/sync`, {
    method: 'POST',
  });
}

export async function listCapabilities(catalogName: string) {
  return request<{ capabilities: API.CatalogCapabilityType[] }>(`/api/catalogs/${catalogName}/capabilities`);
}

export async function installCapability(capabilityName: string) {
  return request<boolean>(`/api/capabilities/${capabilityName}/install`, {
    method: 'POST',
  });
}

export async function addCatalog(params: API.CatalogType) {
  return request<{ catalog: API.CatalogType }>('/api/catalogs', {
    method: 'POST',
    data: {
      ...params,
      method: 'post',
    },
  });
}

export async function updateCatalog(params: API.CatalogType) {
  return request<{ catalog: API.CatalogType }>('/api/catalogs', {
    method: 'POST',
    data: {
      ...params,
      method: 'update',
    },
  });
}

export async function removeCatalog(params: API.CatalogType) {
  return request<{ catalog: API.CatalogType }>(`/api/catalogs/${params.name}`, {
    method: 'DELETE',
    data: {
      ...params,
      method: 'delete',
    },
  });
}

