import { ChevronRight, Database } from 'lucide-react';
import type { AppData, Entity, Plan } from './types';
import { buildProtectionPaths } from './protectionChains';

type ProtectionPathsProps = { data: AppData; t: (key: string) => string; edit: (plan: Plan) => void };

export function ProtectionPaths({ data, t, edit }: ProtectionPathsProps) {
  const entityName = (items: Entity[], id?: string | null) => items.find(item => item.id === id)?.name || '—';
  const paths = data.datasets.flatMap(dataset => buildProtectionPaths(dataset.id, data.plans).map(nodes => ({ dataset, nodes })));
  if (!paths.length) return null;

  return <section className="section-card chain-overview">
    <div className="section-head"><div><span className="eyebrow">{t('protectionPaths')}</span><h2>{t('whereDataTravels')}</h2></div><div className="chain-legend"><span className="backup">{t('backup')}</span><span className="synchronization">{t('synchronization')}</span><span className="archive">{t('archive')}</span></div></div>
    <div className="chain-list">{paths.slice(0, 12).map(({ dataset, nodes }, pathIndex) => <article key={`${dataset.id}-${pathIndex}`}>
      <div className="chain-dataset"><Database/><div><b>{dataset.name}</b><small>{t(dataset.priority)}</small></div></div>
      <div className="chain-path">{nodes.map((node, index) => <div className="chain-node-wrap" key={`${node.plan?.id || node.sourceId}-${index}`}>
        {index > 0 && <span className={`chain-arrow ${node.plan?.protection_type || 'source'}`}><ChevronRight/></span>}
        {node.plan ? <button type="button" className={`chain-node ${node.plan.protection_type}`} onClick={() => edit(node.plan!)}><i style={{ background: node.plan.color }}/>{entityName(data.targets, node.targetId)}<small>{node.plan.source_target_id ? t('availableCopy') : ''}</small></button> : <span className="chain-node source"><i/>{entityName(data.sources, node.sourceId)}</span>}
      </div>)}</div>
    </article>)}</div>
  </section>;
}
