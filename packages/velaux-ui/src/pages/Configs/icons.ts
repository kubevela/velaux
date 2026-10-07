import aliyunImg from '../../assets/aliyun.svg';
import awsImg from '../../assets/aws.svg';
import azureImg from '../../assets/azure.svg';
import defaultConfigSVG from '../../assets/config.svg';
import dockerImg from '../../assets/docker.svg';
import gitImg from '../../assets/git.svg';
import grafanaImg from '../../assets/grafana.svg';
import helmImg from '../../assets/helm.svg';
import nacosImg from '../../assets/nacos.svg';
import prometheusImg from '../../assets/prometheus.svg';
import ssoImg from '../../assets/sso.svg';
import terraformImg from '../../assets/terraform.svg';

// templateIcons are the icons of templates whose names contain the key.
const templateIcons: Array<{ key: string; img: string }> = [
  { key: 'helm-repository', img: helmImg },
  { key: 'image-registry', img: dockerImg },
  { key: 'dex-connector', img: ssoImg },
  { key: 'git', img: gitImg },
  { key: 'alibaba', img: aliyunImg },
  { key: 'aws', img: awsImg },
  { key: 'azure', img: azureImg },
  { key: 'terraform', img: terraformImg },
  { key: 'nacos', img: nacosImg },
  { key: 'grafana', img: grafanaImg },
  { key: 'loki', img: grafanaImg },
  { key: 'prometheus', img: prometheusImg },
];

// templateIcon is a config template's icon, chosen by its name.
export function templateIcon(name: string): string {
  return templateIcons.find((t) => name.includes(t.key))?.img || defaultConfigSVG;
}
