import dva from 'dva';
import createLoading from 'dva-loading';
import { createModel } from './store';

import { createBrowserHistory } from 'history';
import RouterView from './router';
import './i18n';
import './assets/dist/b-design.css';

const app: any = dva({
  history: createBrowserHistory(),
});

app.use(createLoading());
createModel(app);
app.router(RouterView);
app.start('#root');
export default app._store;
