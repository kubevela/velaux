import { DefinitionPlugin } from '@velaux/data';
import { TopologyForm, validateTopology } from './components/TopologyForm';

export const plugin = new DefinitionPlugin().setForm(TopologyForm).setValidator(validateTopology);
