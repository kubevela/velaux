import { Loading } from '@alifd/next';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-light.css';

import { getDefinitionDoc } from '../../api/definitions';
import Empty from '../../components/Empty';
import { Translation } from '../../components/Translation';
import { getLanguage } from '../../utils/common';
import './index.less';
import { definitionPlaceFrom } from '../../utils/definitionPlace';

type Props = {
  match: { params: { definitionType: string; definitionName: string } };
  location: { search: string };
};

// DefinitionDoc is a definition's reference documentation: its description,
// examples and parameters, as KubeVela generates them for vela show.
const DefinitionDoc = (props: Props) => {
  const { definitionType, definitionName } = props.match.params;
  const { project, where } = definitionPlaceFrom(props.location.search);
  const [markdown, setMarkdown] = useState<string>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    getDefinitionDoc({
      project,
      where,
      name: definitionName,
      type: definitionType,
      lang: getLanguage() === 'zh' ? 'zh' : 'en',
    })
      .then((res: any) => setMarkdown(res?.markdown))
      .finally(() => setLoading(false));
  }, [definitionName, definitionType, project, where]);
  return (
    <Loading visible={loading} fullScreen={false} className="definition-doc-loading">
      <div className="definition-doc">
        {!loading && !markdown ? (
          <Empty message={<Translation>No documentation for this definition</Translation>} />
        ) : (
          <ReactMarkdown className="markdown-body" remarkPlugins={[remarkGfm]}>
            {markdown || ''}
          </ReactMarkdown>
        )}
      </div>
    </Loading>
  );
};

export default DefinitionDoc;
