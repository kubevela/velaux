import { Button, Card, Input, Message } from '@alifd/next';
import React from 'react';

import { getCustomisation, updateCustomisation } from '../../../../api/customisation';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { Customisation } from '../../../../services/CustomisationService';
import { customisationService } from '../../../../services/CustomisationService';
import { locale } from '../../../../utils/locale';
import type { Term } from '../../../../utils/terminology';
import { pluralOf } from '../../../../utils/terminology';
import './index.less';

// offeredTerms are the words the card lists to rename; the ConfigMap may hold
// others, which are listed after them, and a new one can be added.
const offeredTerms = ['Application', 'Pipeline', 'Environment', 'Target', 'Project', 'Cluster'];

type State = {
  pageTitle: string;
  logoURL: string;
  iconURL: string;
  sidebarColor: string;
  accentColor: string;
  terms: Record<string, Term>;
  newTerm: string;
  saving: boolean;
};

const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// CustomisationCard edits how this VelaUX is branded: its logo, sidebar colours
// and terminology, kept in the velaux-configuration ConfigMap.
class CustomisationCard extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      pageTitle: '',
      logoURL: '',
      iconURL: '',
      sidebarColor: '',
      accentColor: '',
      terms: {},
      newTerm: '',
      saving: false,
    };
  }

  componentDidMount() {
    getCustomisation().then((c) => this.load(c || {}));
  }

  load = (c: Customisation) => {
    this.setState({
      pageTitle: c.pageTitle || '',
      logoURL: c.logoURL || '',
      iconURL: c.iconURL || '',
      sidebarColor: c.sidebarColor || '',
      accentColor: c.accentColor || '',
      terms: c.terminology || {},
    });
  };

  setTerm = (name: string, field: keyof Term, value: string) => {
    const term = { ...(this.state.terms[name] || { singular: '', plural: '' }), [field]: value };
    this.setState({ terms: { ...this.state.terms, [name]: term } });
  };

  save = (c: Customisation) => {
    this.setState({ saving: true });
    updateCustomisation(c)
      .then((saved) => {
        if (saved) {
          customisationService.set(saved);
          this.load(saved);
          Message.success(i18n.t('Customisation saved').toString());
        }
      })
      .finally(() => this.setState({ saving: false }));
  };

  onSave = () => {
    const { pageTitle, logoURL, iconURL, sidebarColor, accentColor, terms } = this.state;
    // A term is renamed only once it has a singular; its plural defaults to
    // the singular's.
    const terminology: Record<string, Term> = {};
    Object.keys(terms).forEach((name) => {
      const singular = terms[name].singular.trim();
      if (singular) {
        terminology[name] = { singular, plural: terms[name].plural.trim() || pluralOf(singular) };
      }
    });
    this.save({
      pageTitle: pageTitle.trim() || undefined,
      logoURL: logoURL.trim() || undefined,
      iconURL: iconURL.trim() || undefined,
      sidebarColor: hex.test(sidebarColor) ? sidebarColor : undefined,
      accentColor: hex.test(accentColor) ? accentColor : undefined,
      terminology,
    });
  };

  colour = (field: 'sidebarColor' | 'accentColor', label: string, fallback: string) => {
    const value = this.state[field];
    return (
      <div className="customisation-field">
        <label>
          <Translation>{label}</Translation>
        </label>
        <div className="customisation-colour">
          <input
            type="color"
            value={hex.test(value) && value.length === 7 ? value : fallback}
            onChange={(e) => this.setState({ [field]: e.target.value } as any)}
          />
          <Input
            value={value}
            placeholder={i18n.t('Default').toString()}
            onChange={(v: string) => this.setState({ [field]: v } as any)}
            hasClear
          />
        </div>
      </div>
    );
  };

  render() {
    const { pageTitle, logoURL, iconURL, terms, newTerm, saving } = this.state;
    const names = [...offeredTerms, ...Object.keys(terms).filter((t) => !offeredTerms.includes(t))];
    return (
      <Card
        className="customisation-card"
        contentHeight="auto"
        locale={locale().Card}
        title={<Translation>Customisation</Translation>}
        subTitle={<span>velaux-configuration</span>}
      >
        <div className="customisation-grid">
          <div className="customisation-field">
            <label>
              <Translation>Page title (browser tab)</Translation>
            </label>
            <Input
              value={pageTitle}
              maxLength={100}
              placeholder="KubeVela-Make shipping applications more enjoyable."
              onChange={(v: string) => this.setState({ pageTitle: v })}
              hasClear
            />
          </div>
          <div />
          <div className="customisation-field">
            <label>
              <Translation>Logo URL</Translation>
            </label>
            <Input
              value={logoURL}
              placeholder="https://example.com/logo.svg"
              onChange={(v: string) => this.setState({ logoURL: v })}
              hasClear
            />
            {logoURL && <img className="customisation-preview" src={logoURL} />}
          </div>
          <div className="customisation-field">
            <label>
              <Translation>Icon URL (minimised sidebar)</Translation>
            </label>
            <Input
              value={iconURL}
              placeholder="https://example.com/icon.svg"
              onChange={(v: string) => this.setState({ iconURL: v })}
              hasClear
            />
            {iconURL && <img className="customisation-preview icon" src={iconURL} />}
          </div>
          {this.colour('sidebarColor', 'Sidebar colour', '#111827')}
          {this.colour('accentColor', 'Accent colour', '#3b82f6')}
        </div>

        <table className="customisation-terms">
          <thead>
            <tr>
              <th>{i18n.t('Term').toString()}</th>
              <th>{i18n.t('Singular').toString()}</th>
              <th>{i18n.t('Plural').toString()}</th>
            </tr>
          </thead>
          <tbody>
            {names.map((name) => (
              <tr key={name}>
                {/* The default word itself, untranslated, so it is never shown renamed. */}
                <td className="customisation-term-name">{name}</td>
                <td>
                  <Input
                    value={terms[name]?.singular || ''}
                    placeholder={name}
                    onChange={(v: string) => this.setTerm(name, 'singular', v)}
                  />
                </td>
                <td>
                  <Input
                    value={terms[name]?.plural || ''}
                    placeholder={terms[name]?.singular ? pluralOf(terms[name].singular) : pluralOf(name)}
                    onChange={(v: string) => this.setTerm(name, 'plural', v)}
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}>
                <div className="customisation-new-term">
                  <Input
                    value={newTerm}
                    placeholder={i18n.t('Another word to rename, e.g. Addon').toString()}
                    onChange={(v: string) => this.setState({ newTerm: v })}
                  />
                  <Button
                    disabled={!/^[A-Z][a-zA-Z]*$/.test(newTerm) || names.includes(newTerm)}
                    onClick={() =>
                      this.setState({ newTerm: '', terms: { ...terms, [newTerm]: { singular: '', plural: '' } } })
                    }
                  >
                    <Translation>Add</Translation>
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="customisation-actions">
          <Button onClick={() => this.save({})} disabled={saving}>
            <Translation>Reset to defaults</Translation>
          </Button>
          <Button type="primary" onClick={this.onSave} loading={saving}>
            <Translation>Save</Translation>
          </Button>
        </div>
      </Card>
    );
  }
}

export default CustomisationCard;
