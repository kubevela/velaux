import dva from 'dva';
import createLoading from 'dva-loading';
import { createBrowserHistory } from 'history';

import RouterView from './router';
import { createModel } from './store';
import './i18n';
import '@b-design/ui/dist/index.css';
import './common.less';

const app: any = dva({
  history: createBrowserHistory(),
});

app.use(createLoading());
createModel(app);
app.router(RouterView);
app.start('#root');
export default app._store;
