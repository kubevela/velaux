import { Message } from '@alifd/next';
import React, { useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { AiOutlineCopy } from 'react-icons/ai';

import { compareApplication } from '../../api/application';
import DefinitionCode from '../../components/DefinitionCode';
import Empty from '../../components/Empty';
import { RowAction } from '../../components/RowAction';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import { asManifest } from '../../utils/manifest';
import './index.less';

type Props = {
  match: { params: { appName: string; envName: string } };
};

type Mode = 'running' | 'next';

// ApplicationYaml shows an environment's Application as YAML: the one running in
// the cluster, or the one a deploy from VelaUX would apply next.
const ApplicationYaml = (props: Props) => {
  const { appName, envName } = props.match.params;
  const [mode, setMode] = useState<Mode>('running');
  const [yaml, setYaml] = useState<{ running?: string; next?: string }>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    compareApplication(appName, { compareLatestWithRunning: { env: envName } })
      .then((res: any) => setYaml({ running: asManifest(res?.baseAppYAML), next: asManifest(res?.targetAppYAML) }))
      .finally(() => setLoading(false));
  }, [appName, envName]);
  const value = mode === 'running' ? yaml.running : yaml.next;
  return (
    <div className="application-yaml">
      <div className="app-tab-toolbar application-yaml-toolbar">
        <div className="application-yaml-mode" role="group" aria-label="Which Application">
          {(['running', 'next'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? 'active' : ''}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              <Translation>{m === 'running' ? 'Running' : 'Next deploy'}</Translation>
            </button>
          ))}
        </div>
        <span className="app-tab-hint">
          <Translation>
            {mode === 'running'
              ? 'The Application running in the cluster for this environment.'
              : 'The Application a deploy from here would apply.'}
          </Translation>
        </span>
        {value && (
          <CopyToClipboard text={value} onCopy={() => Message.success(i18n.t('Copied').toString())}>
            <RowAction icon={<AiOutlineCopy />} label="Copy" />
          </CopyToClipboard>
        )}
      </div>
      {!loading && !value && (
        <Empty
          message={
            <Translation>
              {mode === 'running' ? 'Not deployed to this environment yet' : 'Nothing to deploy'}
            </Translation>
          }
        />
      )}
      {value && (
        <React.Fragment key={mode}>
          {/* DefinitionCode mounts its editor into the element named by containerId. */}
          <div id={`app-yaml-${envName}-${mode}`} className="application-yaml-code" />
          <DefinitionCode containerId={`app-yaml-${envName}-${mode}`} language="yaml" readOnly value={value} />
        </React.Fragment>
      )}
    </div>
  );
};

export default ApplicationYaml;
