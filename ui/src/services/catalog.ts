import { request } from 'umi';

export async function listCatalogs() {
  return request<API.ListCatalogsResponse>('/api/catalogs');
}
