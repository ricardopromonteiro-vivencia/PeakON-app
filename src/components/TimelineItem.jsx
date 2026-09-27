import React, { useState } from 'react';

// Mapa de labels para as medidas
const METRIC_LABELS = {
  height:   { label: 'Altura',          unit: 'cm' },
  neck:     { label: 'Pescoço',         unit: 'cm' },
  shoulder: { label: 'Ombros',          unit: 'cm' },
  chest:    { label: 'Peito',           unit: 'cm' },
  waist:    { label: 'Cintura',         unit: 'cm' },
  abdomen:  { label: 'Abdómen',         unit: 'cm' },
  hip:      { label: 'Anca',            unit: 'cm' },
  arm:      { label: 'Braço',           unit: 'cm' },
  forearm:  { label: 'Antebraço',       unit: 'cm' },
  thigh:    { label: 'Coxa',            unit: 'cm' },
  calf:     { label: 'Gémeo',           unit: 'cm' },
  body_fat: { label: 'Gordura Corporal', unit: '%'  },
};

export default function TimelineItem({ item }) {
  const date = new Date(item.sortDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  const [expanded, setExpanded] = useState(false);

  if (item.type === 'workout') {
    return (
      <div className="relative pl-14">
        <div className="absolute left-0 top-0 w-11 h-11 bg-primary rounded-full flex items-center justify-center z-10 shadow-lg border-2 border-surface">
          <span className="material-symbols-outlined text-on-primary">fitness_center</span>
        </div>
        <div className="bg-surface-container p-5 rounded-[1.5rem] shadow-sm border border-outline-variant/5 hover:border-outline-variant/20 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-headline font-bold text-lg text-primary leading-tight pr-4">{item.title}</h4>
            <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest whitespace-nowrap bg-surface-container-high px-2 py-1 rounded-md">{date}</span>
          </div>
          {item.notes && <p className="text-on-surface-variant text-sm mt-1 font-medium leading-relaxed">{item.notes}</p>}
        </div>
      </div>
    );
  }

  if (item.type === 'progress') {
    return (
      <div className="relative pl-14">
        <div className="absolute left-0 top-0 w-11 h-11 bg-secondary-container rounded-full flex items-center justify-center z-10 shadow-lg border-2 border-surface">
          <span className="material-symbols-outlined text-on-secondary-container">scale</span>
        </div>
        <div className="bg-surface-container-low p-5 rounded-[1.5rem] shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-headline font-bold text-lg text-[#00677f]">Registo de Peso</h4>
            <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest bg-surface-container-high px-2 py-1 rounded-md">{date}</span>
          </div>
          <div className="text-3xl font-black text-[#00677f]">{item.weight} <span className="text-xl font-bold opacity-50 uppercase tracking-widest">kg</span></div>
          {item.notes && <p className="text-on-surface-variant text-sm mt-2 font-medium">{item.notes}</p>}
        </div>
      </div>
    );
  }

  if (item.type === 'plan_assigned') {
    const isRemoved = item.action === 'removed';
    return (
      <div className="relative pl-14">
        <div className={`absolute left-0 top-0 w-11 h-11 rounded-full flex items-center justify-center z-10 shadow-lg border-2 border-surface ${isRemoved ? 'bg-error/20' : 'bg-primary/20'}`}>
          <span className={`material-symbols-outlined text-lg ${isRemoved ? 'text-error' : 'text-primary'}`}>
            {isRemoved ? 'assignment_return' : 'assignment_turned_in'}
          </span>
        </div>
        <div className="bg-surface-container-low p-4 rounded-[1.5rem] shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <div>
              <h4 className={`font-headline font-bold text-base leading-tight ${isRemoved ? 'text-error' : 'text-primary'}`}>
                {isRemoved ? 'Plano removido' : 'Plano atribuído'}
              </h4>
              <p className="text-on-surface-variant font-bold text-sm mt-0.5">{item.plan_name}</p>
              {item.label && (
                <span className="inline-block mt-1 bg-secondary-container text-on-secondary-container text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {item.label}
                </span>
              )}
            </div>
            <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest bg-surface-container-high px-2 py-1 rounded-md flex-shrink-0 ml-2">
              {date}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'photo') {
    return (
      <div className="relative pl-14">
        <div className="absolute left-0 top-0 w-11 h-11 bg-primary-container rounded-full flex items-center justify-center z-10 shadow-lg border-2 border-surface">
          <span className="material-symbols-outlined text-on-primary-container">photo_camera</span>
        </div>
        <div className="bg-surface-container-low p-2 rounded-[1.5rem] shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-2 px-3 pt-3">
            <h4 className="font-headline font-bold text-lg text-primary-container">Evolução Visual</h4>
            <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest bg-surface-container-high px-2 py-1 rounded-md">{date}</span>
          </div>
          <div className="rounded-[1.2rem] overflow-hidden aspect-square border border-outline-variant/5">
            <img src={item.image_url} alt="Evolução Visual" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'metrics') {
    // Recolhe apenas as medidas que têm valor
    const filledFields = Object.entries(METRIC_LABELS).filter(
      ([key]) => item[key] != null
    );

    return (
      <div className="relative pl-14">
        <div className="absolute left-0 top-0 w-11 h-11 rounded-full flex items-center justify-center z-10 shadow-lg border-2 border-surface"
          style={{ background: 'linear-gradient(135deg, #6750a4, #9c6fdc)' }}>
          <span className="material-symbols-outlined text-white text-lg">straighten</span>
        </div>
        <div className="bg-surface-container-low p-5 rounded-[1.5rem] shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-headline font-bold text-lg text-[#6750a4]">Medidas Corporais</h4>
            <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest bg-surface-container-high px-2 py-1 rounded-md">{date}</span>
          </div>

          {/* Primeiras 4 medidas sempre visíveis */}
          <div className="grid grid-cols-2 gap-2">
            {filledFields.slice(0, expanded ? filledFields.length : 4).map(([key, meta]) => (
              <div key={key} className="bg-surface rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-on-surface-variant text-xs font-bold">{meta.label}</span>
                <span className="text-[#6750a4] font-black text-sm">
                  {item[key]} <span className="text-[10px] font-bold opacity-60">{meta.unit}</span>
                </span>
              </div>
            ))}
          </div>

          {filledFields.length > 4 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-3 text-[#6750a4] text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              <span className={`material-symbols-outlined text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
              {expanded ? 'Ver menos' : `Ver mais ${filledFields.length - 4} medidas`}
            </button>
          )}

          {item.notes && (
            <p className="text-on-surface-variant text-sm mt-3 font-medium italic">"{item.notes}"</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
