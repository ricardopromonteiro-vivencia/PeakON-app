import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import CalendarView from '../components/agenda/CalendarView';
import SlotModal from '../components/agenda/SlotModal';
import BookingCard from '../components/agenda/BookingCard';
import BookingRequestModal from '../components/agenda/BookingRequestModal';
import {
  getAvailabilityByMonth,
  getAvailabilityByDate,
  getBookingsByPT,
  getBookingsByClient,
  deleteSlot,
  getPTIdForClientUser,
  getSessionConfig,
  upsertSessionConfig,
  formatTime,
  getAllSessionConfigs,
} from '../lib/agenda';
import { getClients } from '../lib/api';

// ─── Utilitários ──────────────────────────────────────────
const today = new Date();
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatDateFull(d) {
  if (!d) return '';
  const parts = d.split('-');
  return `${parseInt(parts[2])} de ${MONTHS[parseInt(parts[1]) - 1]}`;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pendente',  bg: 'bg-[#fff8e1]',         text: 'text-[#795548]', dot: 'bg-[#ff9800]' },
  approved: { label: 'Aprovado',  bg: 'bg-secondary-fixed/30', text: 'text-secondary',  dot: 'bg-secondary' },
  rejected: { label: 'Rejeitado', bg: 'bg-error-container/50', text: 'text-error',       dot: 'bg-error' },
};

// ─── VISTA DO PT ─────────────────────────────────────────
function PTAgenda({ user }) {
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [availableDates, setAvailableDates] = useState([]);
  const [slotsForDay, setSlotsForDay] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [sessionConfigs, setSessionConfigs] = useState([]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'bookings' | 'config'
  const [configClientId, setConfigClientId] = useState('');
  const [configMinutes, setConfigMinutes] = useState(60);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState('');
  const [deletingSlot, setDeletingSlot] = useState(null);

  // Carregar disponibilidade do mês
  const loadMonthAvailability = useCallback(async () => {
    try {
      const data = await getAvailabilityByMonth(user.id, calYear, calMonth);
      setAvailableDates([...new Set(data.map((s) => s.date))]);
    } catch (e) { console.error(e); }
  }, [user.id, calYear, calMonth]);

  // Carregar slots do dia selecionado
  const loadDaySlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const data = await getAvailabilityByDate(user.id, selectedDate);
      setSlotsForDay(data);
    } catch (e) { console.error(e); }
    finally { setLoadingSlots(false); }
  }, [user.id, selectedDate]);

  // Carregar reservas
  const loadBookings = useCallback(async () => {
    try {
      const data = await getBookingsByPT(user.id);
      setBookings(data);
    } catch (e) { console.error(e); }
  }, [user.id]);

  // Carregar clientes e configs
  useEffect(() => {
    getClients(user.id).then(setClients).catch(console.error);
    getAllSessionConfigs(user.id).then(setSessionConfigs).catch(console.error);
  }, [user.id]);

  useEffect(() => { loadMonthAvailability(); }, [loadMonthAvailability]);
  useEffect(() => { loadDaySlots(); }, [loadDaySlots]);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handlePrevMonth = () => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  };

  const handleSlotCreated = () => {
    loadMonthAvailability();
    loadDaySlots();
  };

  const handleDeleteSlot = async (slotId) => {
    setDeletingSlot(slotId);
    try {
      await deleteSlot(slotId);
      setSlotsForDay(prev => prev.filter(s => s.id !== slotId));
      loadMonthAvailability();
    } catch (e) { console.error(e); }
    finally { setDeletingSlot(null); }
  };

  const handleBookingStatusChange = (bookingId, newStatus) => {
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
    );
  };

  const handleSaveConfig = async () => {
    if (!configClientId || configMinutes < 15) return;
    setSavingConfig(true);
    setConfigMsg('');
    try {
      await upsertSessionConfig(user.id, configClientId, configMinutes);
      const updated = await getAllSessionConfigs(user.id);
      setSessionConfigs(updated);
      setConfigMsg('Guardado com sucesso!');
      setTimeout(() => setConfigMsg(''), 3000);
    } catch (e) {
      setConfigMsg('Erro ao guardar.');
      console.error(e);
    } finally { setSavingConfig(false); }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <section>
        <p className="text-on-surface-variant font-label text-sm font-black uppercase tracking-widest mb-1 opacity-70">
          Gestão de Sessões
        </p>
        <h2 className="text-primary font-headline font-black text-4xl tracking-tighter">
          Agenda
        </h2>
      </section>

      {/* Tabs */}
      <div className="flex bg-surface-container rounded-[1.3rem] p-1 gap-1">
        {[
          { key: 'calendar', icon: 'calendar_month', label: 'Calendário' },
          { key: 'bookings', icon: 'pending_actions', label: `Pedidos${pendingBookings.length > 0 ? ` (${pendingBookings.length})` : ''}` },
          { key: 'config',   icon: 'settings',        label: 'Config' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[1rem] text-xs font-black uppercase tracking-wide transition-all
              ${activeTab === tab.key
                ? 'bg-surface text-primary shadow-sm'
                : 'text-outline hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.key === 'bookings' && pendingBookings.length > 0 && (
              <span className="w-4 h-4 bg-primary text-on-primary rounded-full text-[9px] font-black flex items-center justify-center">
                {pendingBookings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: CALENDÁRIO ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <CalendarView
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            year={calYear}
            month={calMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          {/* Detalhe do dia selecionado */}
          {selectedDate && (
            <div className="bg-surface-container-low rounded-[2rem] p-5 border border-outline-variant/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">
                    Disponibilidade
                  </p>
                  <h3 className="font-headline font-bold text-lg text-primary mt-0.5">
                    {formatDateFull(selectedDate)}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSlotModal(true)}
                  className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2.5 rounded-[1rem] shadow-md active:scale-95 transition-all text-sm font-bold"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Novo Slot
                </button>
              </div>

              {loadingSlots ? (
                <div className="flex justify-center py-4">
                  <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
                </div>
              ) : slotsForDay.length === 0 ? (
                <div className="text-center py-6 text-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-3xl text-outline mb-2 block">event_busy</span>
                  Nenhuma disponibilidade para este dia.
                  <br />
                  <span className="font-bold text-primary">Clica em "Novo Slot" para adicionar.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {slotsForDay.map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-surface-container rounded-[1.2rem] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-xl">schedule</span>
                        <div>
                          <p className="font-bold text-on-surface text-sm">
                            {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                          </p>
                          <p className="text-xs text-outline">
                            {(() => {
                              const [sh, sm] = slot.start_time.split(':').map(Number);
                              const [eh, em] = slot.end_time.split(':').map(Number);
                              return `${(eh * 60 + em) - (sh * 60 + sm)} min disponíveis`;
                            })()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={deletingSlot === slot.id}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-error hover:bg-error-container active:scale-90 transition-all disabled:opacity-40"
                      >
                        {deletingSlot === slot.id
                          ? <span className="material-symbols-outlined animate-spin text-base">sync</span>
                          : <span className="material-symbols-outlined text-base">delete</span>
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PEDIDOS ── */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Pendentes */}
          {pendingBookings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70 px-1">
                ⏳ A aguardar aprovação
              </p>
              {pendingBookings.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onStatusChange={handleBookingStatusChange}
                />
              ))}
            </div>
          )}

          {/* Todas as outras */}
          {bookings.filter(b => b.status !== 'pending').length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70 px-1">
                Histórico
              </p>
              {bookings
                .filter(b => b.status !== 'pending')
                .map(b => <BookingCard key={b.id} booking={b} onStatusChange={handleBookingStatusChange} />)
              }
            </div>
          )}

          {bookings.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl text-outline mb-3 block">inbox</span>
              <p className="font-bold text-base">Nenhum pedido ainda.</p>
              <p className="text-sm mt-1 opacity-70">Quando os alunos fizerem pedidos, aparecerão aqui.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CONFIGURAÇÕES ── */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <div className="bg-surface-container-low rounded-[2rem] p-5 border border-outline-variant/10 space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70 mb-1">
                Duração da Sessão por Aluno
              </p>
              <p className="text-sm text-on-surface-variant">
                Define quanto tempo tem a sessão de cada aluno. O aluno só pode reservar esse bloco.
              </p>
            </div>

            {/* Selector de cliente */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">
                Aluno
              </label>
              <select
                value={configClientId}
                onChange={(e) => {
                  setConfigClientId(e.target.value);
                  const cfg = sessionConfigs.find(c => c.client_id === e.target.value);
                  setConfigMinutes(cfg?.session_duration_minutes || 60);
                }}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-[1rem] px-4 py-3 text-on-surface font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="">Selecionar aluno...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Duração */}
            {configClientId && (
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">
                  Duração (minutos)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[30, 45, 60, 75, 90, 120].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setConfigMinutes(m)}
                      className={`px-4 py-2 rounded-[1rem] text-sm font-bold transition-all active:scale-95
                        ${configMinutes === m
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'bg-surface-container border border-outline-variant/20 text-on-surface hover:border-primary/40'
                        }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={configMinutes}
                  onChange={(e) => setConfigMinutes(Number(e.target.value))}
                  min={15}
                  max={240}
                  step={5}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-[1rem] px-4 py-3 text-on-surface font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all mt-2"
                />
              </div>
            )}

            {configClientId && (
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-[1.3rem] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingConfig
                  ? <span className="material-symbols-outlined animate-spin">sync</span>
                  : <><span className="material-symbols-outlined">save</span> Guardar</>
                }
              </button>
            )}
            {configMsg && (
              <p className="text-center text-sm font-bold text-secondary">{configMsg}</p>
            )}
          </div>

          {/* Tabela de configurações actuais */}
          {sessionConfigs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70 px-1">
                Configurações Actuais
              </p>
              {sessionConfigs.map(cfg => (
                <div
                  key={cfg.id}
                  onClick={() => {
                    setConfigClientId(cfg.client_id);
                    setConfigMinutes(cfg.session_duration_minutes);
                  }}
                  className="bg-surface-container-low rounded-[1.3rem] px-4 py-3 flex items-center justify-between border border-outline-variant/10 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-fixed rounded-full flex items-center justify-center text-primary font-black text-sm uppercase">
                      {cfg.clients?.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-bold text-on-surface text-sm">{cfg.clients?.name || '—'}</span>
                  </div>
                  <span className="text-sm font-black text-primary">{cfg.session_duration_minutes} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de criar slot */}
      {showSlotModal && (
        <SlotModal
          ptId={user.id}
          date={selectedDate}
          onClose={() => setShowSlotModal(false)}
          onSlotCreated={handleSlotCreated}
        />
      )}
    </div>
  );
}

// ─── VISTA DO CLIENTE ─────────────────────────────────────
function ClientAgenda({ user }) {
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [slotsForDay, setSlotsForDay] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [ptInfo, setPtInfo] = useState(null); // { ptId, clientId }
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);

  // Inicializar: buscar ptId e clientId para este utilizador
  useEffect(() => {
    const init = async () => {
      setLoadingInit(true);
      try {
        const info = await getPTIdForClientUser(user.id);
        if (!info) return;
        setPtInfo(info);

        const [availData, bookData, cfg] = await Promise.all([
          getAvailabilityByMonth(info.ptId, calYear, calMonth),
          getBookingsByClient(info.clientId),
          getSessionConfig(info.ptId, info.clientId),
        ]);

        setAvailableDates([...new Set(availData.map(s => s.date))]);
        setBookings(bookData);
        setSessionDuration(cfg?.session_duration_minutes || 60);
      } catch (e) { console.error(e); }
      finally { setLoadingInit(false); }
    };
    init();
  }, [user.id, calYear, calMonth]);

  // Atualizar disponibilidade ao mudar de mês
  useEffect(() => {
    if (!ptInfo) return;
    getAvailabilityByMonth(ptInfo.ptId, calYear, calMonth)
      .then(data => setAvailableDates([...new Set(data.map(s => s.date))]))
      .catch(console.error);
  }, [ptInfo, calYear, calMonth]);

  // Carregar slots do dia selecionado
  useEffect(() => {
    if (!selectedDate || !ptInfo) return;
    setLoadingSlots(true);
    setSlotsForDay([]);
    getAvailabilityByDate(ptInfo.ptId, selectedDate)
      .then(setSlotsForDay)
      .catch(console.error)
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, ptInfo]);

  const handlePrevMonth = () => {
    if (calMonth === 1) { setCalYear(prev => prev - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (calMonth === 12) { setCalYear(prev => prev + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  };

  const handleBooked = (booking) => {
    setBookings(prev => [booking, ...prev]);
    setSelectedSlot(null);
  };

  const bookedDates = [...new Set(
    bookings
      .filter(b => b.status !== 'rejected')
      .map(b => b.booking_date)
  )];

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const rejectedBookings = bookings.filter(b => b.status === 'rejected');

  if (loadingInit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        <p className="text-on-surface-variant font-medium">A carregar agenda...</p>
      </div>
    );
  }

  if (!ptInfo) {
    return (
      <div className="text-center py-16 space-y-3">
        <span className="material-symbols-outlined text-5xl text-outline block">link_off</span>
        <h3 className="font-bold text-xl text-primary">Sem PT associado</h3>
        <p className="text-sm text-on-surface-variant">
          A tua conta ainda não está ligada a um Personal Trainer.
          Pede o teu código de convite ao PT.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <section>
        <p className="text-on-surface-variant font-label text-sm font-black uppercase tracking-widest mb-1 opacity-70">
          As Minhas Sessões
        </p>
        <h2 className="text-primary font-headline font-black text-4xl tracking-tighter">
          Agenda
        </h2>
      </section>

      {/* Info da sessão */}
      <div className="bg-primary-fixed/40 rounded-[1.3rem] px-4 py-3 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">timer</span>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">Duração da tua sessão</p>
          <p className="font-bold text-primary text-base">{sessionDuration} minutos</p>
        </div>
      </div>

      {/* Calendário */}
      <CalendarView
        availableDates={availableDates}
        bookedDates={bookedDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        year={calYear}
        month={calMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Detalhe do dia */}
      {selectedDate && (
        <div className="bg-surface-container-low rounded-[2rem] p-5 border border-outline-variant/10 space-y-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-70">
              Disponibilidade
            </p>
            <h3 className="font-headline font-bold text-lg text-primary mt-0.5">
              {formatDateFull(selectedDate)}
            </h3>
          </div>

          {loadingSlots ? (
            <div className="flex justify-center py-4">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
            </div>
          ) : slotsForDay.length === 0 ? (
            <p className="text-center text-sm text-on-surface-variant py-4">
              <span className="material-symbols-outlined text-2xl text-outline block mb-1">event_busy</span>
              O teu PT não tem disponibilidade neste dia.
            </p>
          ) : (
            <div className="space-y-2">
              {slotsForDay.map(slot => {
                const myBooking = bookings.find(b => b.availability_id === slot.id && b.status !== 'rejected');
                return (
                  <div key={slot.id} className="bg-surface-container rounded-[1.2rem] px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">schedule</span>
                        <span className="font-bold text-on-surface text-sm">
                          {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                        </span>
                      </div>
                      {myBooking ? (
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${STATUS_CONFIG[myBooking.status]?.bg} ${STATUS_CONFIG[myBooking.status]?.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[myBooking.status]?.dot}`} />
                          {STATUS_CONFIG[myBooking.status]?.label}
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedSlot(slot)}
                          className="bg-primary text-on-primary text-xs font-black px-3 py-2 rounded-[0.8rem] active:scale-95 transition-all shadow-sm"
                        >
                          Reservar
                        </button>
                      )}
                    </div>
                    {myBooking && (
                      <div className="text-xs text-on-surface-variant pl-6">
                        Sessão: {formatTime(myBooking.start_time)} — {formatTime(myBooking.end_time)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* As minhas reservas */}
      {bookings.length > 0 && (
        <div className="space-y-3">
          <p className="text-on-surface-variant font-label text-xs font-black uppercase tracking-widest opacity-70">
            As Minhas Marcações
          </p>

          {/* Aprovadas */}
          {approvedBookings.map(b => (
            <div key={b.id} className="bg-secondary-fixed/20 rounded-[1.5rem] p-4 border border-secondary/20 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-xs font-black text-secondary uppercase tracking-wider">Confirmada</span>
                </div>
                <span className="text-xs text-outline">{formatDateFull(b.booking_date)}</span>
              </div>
              <p className="font-bold text-on-surface text-sm pl-3.5">
                {formatTime(b.start_time)} — {formatTime(b.end_time)}
              </p>
            </div>
          ))}

          {/* Pendentes */}
          {pendingBookings.map(b => (
            <div key={b.id} className="bg-[#fff8e1] rounded-[1.5rem] p-4 border border-[#ff9800]/20 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff9800]" />
                  <span className="text-xs font-black text-[#795548] uppercase tracking-wider">Aguarda Aprovação</span>
                </div>
                <span className="text-xs text-outline">{formatDateFull(b.booking_date)}</span>
              </div>
              <p className="font-bold text-on-surface text-sm pl-3.5">
                {formatTime(b.start_time)} — {formatTime(b.end_time)}
              </p>
            </div>
          ))}

          {/* Rejeitadas */}
          {rejectedBookings.map(b => (
            <div key={b.id} className="bg-error-container/30 rounded-[1.5rem] p-4 border border-error/10 space-y-1 opacity-70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-error" />
                  <span className="text-xs font-black text-error uppercase tracking-wider">Rejeitada</span>
                </div>
                <span className="text-xs text-outline">{formatDateFull(b.booking_date)}</span>
              </div>
              <p className="font-bold text-on-surface text-sm pl-3.5">
                {formatTime(b.start_time)} — {formatTime(b.end_time)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal de pedido de reserva */}
      {selectedSlot && ptInfo && (
        <BookingRequestModal
          slot={selectedSlot}
          clientId={ptInfo.clientId}
          ptId={ptInfo.ptId}
          sessionDuration={sessionDuration}
          onClose={() => setSelectedSlot(null)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function Agenda() {
  const { user, userProfile } = useAppStore();
  const role = userProfile?.role || 'client';

  if (!user) return null;

  return role === 'pt'
    ? <PTAgenda user={user} userProfile={userProfile} />
    : <ClientAgenda user={user} userProfile={userProfile} />;
}
