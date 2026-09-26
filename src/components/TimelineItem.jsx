import React from 'react';

export default function TimelineItem({ item }) {
  const date = new Date(item.sortDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });

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

  return null;
}
