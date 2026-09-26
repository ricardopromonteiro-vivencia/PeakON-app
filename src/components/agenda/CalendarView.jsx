import React, { useState } from 'react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * CalendarView
 * @param {string[]} availableDates - array de datas ISO 'YYYY-MM-DD' com disponibilidade
 * @param {string[]} bookedDates - datas que têm reservas do cliente (só para view de cliente)
 * @param {string|null} selectedDate - data seleccionada
 * @param {function} onSelectDate - callback ao clicar num dia
 * @param {number} year
 * @param {number} month - 1-indexed
 * @param {function} onPrevMonth
 * @param {function} onNextMonth
 */
export default function CalendarView({
  availableDates = [],
  bookedDates = [],
  selectedDate,
  onSelectDate,
  year,
  month,
  onPrevMonth,
  onNextMonth,
}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Calcular dias do mês
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(year, month, 0).getDate();

  // Gerar células do calendário
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null); // espaços vazios
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (d) =>
    `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="bg-surface-container-low rounded-[2rem] p-4 shadow-sm border border-outline-variant/10">
      {/* Cabeçalho de navegação */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={onPrevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-90 transition-all text-primary"
        >
          <span className="material-symbols-outlined text-xl">chevron_left</span>
        </button>
        <span className="font-headline font-bold text-base text-primary tracking-tight">
          {MONTHS[month - 1]} {year}
        </span>
        <button
          onClick={onNextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-90 transition-all text-primary"
        >
          <span className="material-symbols-outlined text-xl">chevron_right</span>
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-outline py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Células dos dias */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const ds = dateStr(day);
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          const hasAvailability = availableDates.includes(ds);
          const hasBooking = bookedDates.includes(ds);
          const isPast = ds < todayStr;

          return (
            <button
              key={ds}
              onClick={() => !isPast && onSelectDate(ds)}
              disabled={isPast}
              className={`
                relative flex flex-col items-center justify-center w-full aspect-square rounded-[0.9rem] transition-all duration-150
                ${isSelected
                  ? 'bg-primary text-on-primary shadow-lg scale-105'
                  : isToday
                  ? 'bg-primary-fixed text-primary font-black'
                  : isPast
                  ? 'opacity-30 cursor-default'
                  : hasAvailability
                  ? 'hover:bg-secondary-fixed/50 active:scale-95 cursor-pointer'
                  : 'hover:bg-surface-container active:scale-95 cursor-pointer'
                }
              `}
            >
              <span className={`text-sm font-bold leading-none ${isSelected ? 'text-on-primary' : isToday ? 'text-primary' : 'text-on-surface'}`}>
                {day}
              </span>
              {/* Indicadores */}
              <div className="flex gap-[3px] mt-[3px]">
                {hasAvailability && !isSelected && (
                  <span className="w-[5px] h-[5px] rounded-full bg-secondary block" />
                )}
                {hasBooking && !isSelected && (
                  <span className="w-[5px] h-[5px] rounded-full bg-primary block" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex gap-4 mt-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-secondary block" />
          <span className="text-[10px] text-outline font-medium">Disponível</span>
        </div>
        {bookedDates.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary block" />
            <span className="text-[10px] text-outline font-medium">Reservado</span>
          </div>
        )}
      </div>
    </div>
  );
}
