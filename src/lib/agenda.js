import { supabase } from './supabase';

// ─── DISPONIBILIDADE DO PT ──────────────────────────────────

/** Busca todos os slots de disponibilidade de um PT num mês/ano */
export async function getAvailabilityByMonth(ptId, year, month) {
  // month é 1-indexed
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const { data, error } = await supabase
    .from('pt_availability')
    .select('*')
    .eq('pt_id', ptId)
    .eq('is_active', true)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

/** Busca slots de um dia específico */
export async function getAvailabilityByDate(ptId, date) {
  const { data, error } = await supabase
    .from('pt_availability')
    .select('*')
    .eq('pt_id', ptId)
    .eq('date', date)
    .eq('is_active', true)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

/** PT cria um slot de disponibilidade */
export async function createSlot(ptId, date, startTime, endTime) {
  const { data, error } = await supabase
    .from('pt_availability')
    .insert([{ pt_id: ptId, date, start_time: startTime, end_time: endTime }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** PT apaga (desativa) um slot */
export async function deleteSlot(slotId) {
  const { error } = await supabase
    .from('pt_availability')
    .update({ is_active: false })
    .eq('id', slotId);

  if (error) throw error;
}

// ─── CONFIGURAÇÃO DE SESSÃO POR CLIENTE ────────────────────

/** Busca a configuração de sessão de um cliente específico */
export async function getSessionConfig(ptId, clientId) {
  const { data, error } = await supabase
    .from('client_session_config')
    .select('*')
    .eq('pt_id', ptId)
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** PT define/atualiza a duração da sessão de um cliente */
export async function upsertSessionConfig(ptId, clientId, durationMinutes) {
  const { data, error } = await supabase
    .from('client_session_config')
    .upsert(
      { pt_id: ptId, client_id: clientId, session_duration_minutes: durationMinutes },
      { onConflict: 'pt_id,client_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Busca todas as configurações de sessão dos clientes de um PT */
export async function getAllSessionConfigs(ptId) {
  const { data, error } = await supabase
    .from('client_session_config')
    .select('*, clients(name, photo_url)')
    .eq('pt_id', ptId);

  if (error) throw error;
  return data;
}

// ─── RESERVAS ───────────────────────────────────────────────

/** PT busca todas as suas reservas (com info do cliente e slot) */
export async function getBookingsByPT(ptId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      clients (name, photo_url),
      pt_availability (date, start_time, end_time)
    `)
    .eq('pt_id', ptId)
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

/** Cliente busca as suas reservas */
export async function getBookingsByClient(clientId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      pt_availability (date, start_time, end_time)
    `)
    .eq('client_id', clientId)
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

/** Busca reservas de um slot específico (para verificar sobreposições) */
export async function getBookingsBySlot(availabilityId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('availability_id', availabilityId)
    .in('status', ['pending', 'approved']);

  if (error) throw error;
  return data;
}

/** Cliente faz um pedido de reserva */
export async function createBooking(payload) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** PT aprova ou rejeita uma reserva */
export async function updateBookingStatus(bookingId, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── UTILITÁRIOS ────────────────────────────────────────────

/** Dado um userId de client, retorna o ptId (user_id do cliente) */
export async function getPTIdForClientUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('linked_client_id')
    .eq('id', userId)
    .single();

  if (error) throw error;
  if (!data?.linked_client_id) return null;

  const { data: client, error: ce } = await supabase
    .from('clients')
    .select('user_id, id')
    .eq('id', data.linked_client_id)
    .single();

  if (ce) throw ce;
  return { ptId: client.user_id, clientId: client.id };
}

/** Formata hora "HH:MM:SS" para "HH:MM" */
export function formatTime(time) {
  if (!time) return '';
  return time.slice(0, 5);
}

/** Adiciona minutos a uma hora no formato "HH:MM" ou "HH:MM:SS" */
export function addMinutesToTime(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

/** Verifica se um horário de início caberia dentro de um slot sem sobreposição */
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
