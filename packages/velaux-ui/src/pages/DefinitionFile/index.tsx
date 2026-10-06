import { Button, Loading, Message } from '@alifd/next';
import React, { useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { AiOutlineCopy } from 'react-icons/ai';

import { getDefinitionCUE } from '../../api/definitions';
import Empty from '../../components/Empty';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import '../DefinitionDoc/index.less';
import './index.less';
import { definitionPlaceFrom } from '../../utils/definitionPlace';

type Props = {
  match: { params: { definitionType: string; definitionName: string } };
  location: { search: string };
};

// DefinitionFile is a definition as the CUE file it is authored as, the way
// vela def get prints it.
const DefinitionFile = (props: Props) => {
  const { definitionType, definitionName } = props.match.params;
  const { project, where } = definitionPlaceFrom(props.location.search);
  const [cue, setCue] = useState<string>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    getDefinitionCUE({ project, where, name: definitionName, type: definitionType })
      .then((res: any) => setCue(res?.cue))
      .finally(() => setLoading(false));
  }, [definitionName, definitionType, project, where]);
  return (
    <Loading visible={loading} fullScreen={false} className="definition-doc-loading">
      <div className="definition-doc definition-file">
        {!loading && !cue ? (
          <Empty message={<Translation>No file for this definition</Translation>} />
        ) : (
          <>
            <div className="definition-file-head">
              <code>{`${definitionName}.cue`}</code>
              <CopyToClipboard text={cue || ''} onCopy={() => Message.success(i18n.t('Copied').toString())}>
                <Button size="small">
                  <AiOutlineCopy /> <Translation>Copy</Translation>
                </Button>
              </CopyToClipboard>
            </div>
            <pre className="definition-file-code">{cue}</pre>
          </>
        )}
      </div>
    </Loading>
  );
};

export default DefinitionFile;
