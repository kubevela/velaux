import BasicLayout from '../layout/index';

//TODO: Load all single page routes from all installed plugins

export default [
  {
    path: '/',
    name: 'basicLayout',
    component: BasicLayout,
    auth: true,
  },
];
