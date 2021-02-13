import { useState } from 'react';
import * as api from '@/services/catalog';

interface State {}

export default function useCatalogs(params: {}) {
  const [state, setState] = useState<State>({});

  const listCatalogs = async () => {
    setState({ ...state, loading: true });
    const { catalogs } = await api.listCatalogs();
    // setCatalogs(catalogs);
    return catalogs;
  };

  return {
    ...state,
    listCatalogs,
  };
}
