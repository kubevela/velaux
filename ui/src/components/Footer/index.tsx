import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-layout';

export default () => (
  <DefaultFooter
    copyright="2021 KubeVela Authors"
    links={[
      {
        key: 'KubeVela',
        title: 'KubeVela',
        href: 'https://kubevela.io/',
        blankTarget: true,
      },
      {
        key: 'github',
        title: <GithubOutlined />,
        href: 'https://github.com/oam-dev/kubevela',
        blankTarget: true,
      },
      {
        key: 'velacp',
        title: 'velacp',
        href: 'https://github.com/oam-dev/velacp',
        blankTarget: true,
      },
    ]}
  />
);
