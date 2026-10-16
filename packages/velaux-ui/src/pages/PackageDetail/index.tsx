import { Message } from '@alifd/next';
import { Link } from 'dva/router';
import React, { useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { AiOutlineArrowLeft, AiOutlineCopy, AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import { BsBoxSeam } from 'react-icons/bs';

import type { PackageDetail as Detail, PackageFunction, PackageType } from '@velaux/data';
import { detailBuiltinPackage, detailPackage } from '../../api/package';
import Empty from '../../components/Empty';
import { RowAction } from '../../components/RowAction';
import '../../components/RowList';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import { FieldTree } from '../Packages/FieldTree';
import '../Packages/index.less';
import './index.less';

type Props = {
  match: { params: { namespace?: string; name?: string } };
  location: { search: string };
};

type Tab = 'functions' | 'types' | 'files';

const Copy = (props: { text: string; label: string }) => (
  <CopyToClipboard text={props.text} onCopy={() => Message.success(i18n.t('Copied').toString())}>
    <RowAction icon={<AiOutlineCopy />} label={props.label} />
  </CopyToClipboard>
);

// FunctionRow is a function, expanding to what it takes, what it gives back and
// how a definition calls it.
const FunctionRow = (props: { fn: PackageFunction }) => {
  const { fn } = props;
  const [open, setOpen] = useState(false);
  return (
    <div className={`row-list-row ${open ? 'expanded' : ''}`}>
      <div className="row-list-main">
        <span className="row-list-chevron" onClick={() => setOpen(!open)}>
          {open ? <AiOutlineDown /> : <AiOutlineRight />}
        </span>
        <span className="row-list-name" onClick={() => setOpen(!open)}>
          <span>
            <span className="row-list-title package-def">{fn.name}</span>
            {fn.description && <span className="row-list-type">{fn.description}</span>}
          </span>
        </span>
        <span>
          <code className="row-list-code">{fn.do}</code>
        </span>
        <span className="row-list-muted">{fn.provider}</span>
      </div>
      {open && (
        <div className="row-list-detail package-function-detail">
          <div className="row-list-detail-title">
            <Translation>Parameters</Translation> <code className="package-key">$params</code>
          </div>
          <FieldTree fields={fn.params} type={fn.paramsType} empty="Takes no parameters" />
          <div className="row-list-detail-title">
            <Translation>Returns</Translation> <code className="package-key">$returns</code>
          </div>
          <FieldTree fields={fn.returns} type={fn.returnsType} empty="Returns nothing declared" />
          <div className="row-list-detail-title package-usage-title">
            <Translation>Usage</Translation>
            <Copy text={fn.usage} label="Copy" />
          </div>
          <pre className="package-code">{fn.usage}</pre>
        </div>
      )}
    </div>
  );
};

// TypeRow is a definition that is not a function, expanding to its fields.
const TypeRow = (props: { type: PackageType }) => {
  const { type } = props;
  const [open, setOpen] = useState(false);
  return (
    <div className={`row-list-row ${open ? 'expanded' : ''}`}>
      <div className="row-list-main">
        <span className="row-list-chevron" onClick={() => setOpen(!open)}>
          {open ? <AiOutlineDown /> : <AiOutlineRight />}
        </span>
        <span className="row-list-name" onClick={() => setOpen(!open)}>
          <span>
            <span className="row-list-title package-def">{type.name}</span>
            {type.description && <span className="row-list-type">{type.description}</span>}
          </span>
        </span>
      </div>
      {open && (
        <div className="row-list-detail">
          <FieldTree fields={type.fields} type={type.type} empty="No fields" />
        </div>
      )}
    </div>
  );
};

// PackageDetail is a package and what it offers: its functions, its other
// definitions and its files.
const PackageDetail = (props: Props) => {
  const { namespace, name } = props.match.params;
  const query = new URLSearchParams(props.location.search);
  const builtinPath = query.get('path') || '';
  const variant = query.get('variant') || '';
  const [detail, setDetail] = useState<Detail>();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('functions');
  useEffect(() => {
    setLoading(true);
    const load = namespace && name ? detailPackage(namespace, name) : detailBuiltinPackage(builtinPath, variant);
    load.then((res: any) => setDetail(res && res.path ? res : undefined)).finally(() => setLoading(false));
  }, [namespace, name, builtinPath, variant]);
  if (!detail) {
    return loading ? null : <Empty message={<Translation>No such package</Translation>} />;
  }
  const importLine = `import "${detail.path}"`;
  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'functions', label: 'Functions', count: (detail.functionList || []).length },
    { key: 'types', label: 'Types', count: (detail.types || []).length },
    { key: 'files', label: 'Files', count: (detail.fileList || []).length },
  ];
  return (
    <div className="package-detail">
      <Link className="package-back" to="/packages">
        <AiOutlineArrowLeft /> <Translation>All packages</Translation>
      </Link>
      <div className="package-head">
        <BsBoxSeam className="package-head-icon" />
        <h1>{detail.name}</h1>
        {detail.builtin ? (
          <StatusBadge tone="neutral" label="Built-in" title={i18n.t('Part of KubeVela').toString()} />
        ) : (
          <span className="package-namespace">{detail.namespace}</span>
        )}
      </div>
      <div className="package-facts">
        <div>
          <span>
            <Translation>Import</Translation>
          </span>
          <code className="package-import">{importLine}</code>
          <Copy text={importLine} label="Copy" />
        </div>
        {detail.packageName && (
          <div>
            <span>
              <Translation>Call as</Translation>
            </span>
            <code>{`${detail.packageName}.#Function`}</code>
          </div>
        )}
        <div>
          <span>
            <Translation>Provider</Translation>
          </span>
          {detail.provider ? (
            <span>
              <span className="package-protocol">{detail.provider.protocol}</span> {detail.provider.endpoint}
            </span>
          ) : (
            <Translation>{detail.builtin ? 'Runs in KubeVela' : 'CUE only, no provider'}</Translation>
          )}
        </div>
        {detail.provider?.headers && detail.provider.headers.length > 0 && (
          <div>
            <span>
              <Translation>Headers</Translation>
            </span>
            <span title={i18n.t('Values are not shown').toString()}>{detail.provider.headers.join(', ')}</span>
          </div>
        )}
        {detail.usedBy && detail.usedBy.length > 0 && (
          <div>
            <span>
              <Translation>Imported by</Translation>
            </span>
            <span>{detail.usedBy.map((u) => i18n.t(u)).join(', ')}</span>
          </div>
        )}
      </div>
      {detail.issue && (
        <div className="package-issue">
          <Translation>Its files could not be read</Translation>: {detail.issue}
        </div>
      )}
      <div className="package-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
          >
            <Translation>{t.label}</Translation> <span className="package-tab-count">{t.count}</span>
          </button>
        ))}
      </div>
      {tab === 'functions' &&
        ((detail.functionList || []).length === 0 ? (
          <Empty message={<Translation>No functions</Translation>} />
        ) : (
          <div className="row-list package-function-list">
            <div className="row-list-head">
              <span />
              <span>
                <Translation>Function</Translation>
              </span>
              <span>
                <Translation>Operation</Translation>
              </span>
              <span>
                <Translation>Provider</Translation>
              </span>
            </div>
            {(detail.functionList || []).map((fn) => (
              <FunctionRow key={fn.name} fn={fn} />
            ))}
          </div>
        ))}
      {tab === 'types' &&
        ((detail.types || []).length === 0 ? (
          <Empty message={<Translation>No types</Translation>} />
        ) : (
          <div className="row-list package-type-list">
            {(detail.types || []).map((t) => (
              <TypeRow key={t.name} type={t} />
            ))}
          </div>
        ))}
      {tab === 'files' &&
        (detail.fileList || []).map((f) => (
          <div key={f.name} className="package-file">
            <div className="package-file-head">
              <code>{f.name}</code>
              <Copy text={f.content} label="Copy" />
            </div>
            <pre className="package-code">{f.content}</pre>
          </div>
        ))}
    </div>
  );
};

export default PackageDetail;
