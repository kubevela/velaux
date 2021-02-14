import { request } from 'umi';

export async function listCatalogs() {
  return request<API.ListCatalogsResponse>('/api/catalogs');
}

export async function addCatalog(params: API.CatalogType) {
  return request<API.CatalogType>('/api/catalogs', {
    method: 'POST',
    data: {
      ...params,
      method: 'post',
    },
  });
}

export async function removeCatalog(params: API.CatalogType) {
  return request<API.CatalogType>('/api/catalogs', {
    method: 'POST',
    data: {
      ...params,
      method: 'delete',
    },
  });
}
