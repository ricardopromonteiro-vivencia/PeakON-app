import { supabase } from './supabase';

// ─── Leitura ────────────────────────────────────────────────

/** Devolve o pack ativo de um aluno (ou null se não tiver) */
export async function getClientPack(clientId) {
  const { data, error } = await supabase
    .from('client_packs')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Devolve o histórico de transações de um aluno, ordem desc */
export async function getPackTransactions(clientId, limit = 50) {
  const { data, error } = await supabase
    .from('pack_transactions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ─── Criação / Edição ────────────────────────────────────────

/**
 * Cria um novo pack para um aluno.
 * Se já existir um pack ativo, desativa-o primeiro.
 *
 * @param {string} ptId
 * @param {string} clientId
 * @param {{ totalSessions: number, renewalType: 'monthly'|'weekly'|'manual', startDate?: Date }} options
 */
export async function createClientPack(ptId, clientId, { totalSessions, renewalType, startDate }) {
  // 1. Desativar pack anterior, se existir
  await supabase
    .from('client_packs')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .eq('is_active', true);

  // 2. Calcular data da próxima renovação
  const base = startDate ? new Date(startDate) : new Date();
  let nextRenewal = null;
  if (renewalType === 'monthly') {
    nextRenewal = new Date(base);
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);
  } else if (renewalType === 'weekly') {
    nextRenewal = new Date(base);
    nextRenewal.setDate(nextRenewal.getDate() + 7);
  }

  // 3. Criar pack
  const { data: pack, error } = await supabase
    .from('client_packs')
    .insert([{
      client_id: clientId,
      pt_id: ptId,
      total_sessions: totalSessions,
      renewal_type: renewalType,
      next_renewal_at: nextRenewal?.toISOString() ?? null,
      sessions_remaining: totalSessions,
      is_active: true,
    }])
    .select()
    .single();

  if (error) throw error;

  // 4. Registar transação inicial
  await supabase.from('pack_transactions').insert([{
    pack_id: pack.id,
    client_id: clientId,
    pt_id: ptId,
    type: 'create',
    amount: totalSessions,
    balance_before: 0,
    balance_after: totalSessions,
    notes: `Pack criado (${renewalType === 'monthly' ? 'Mensal' : renewalType === 'weekly' ? 'Semanal' : 'Manual'})`,
  }]);

  return pack;
}

// ─── Operações de saldo ──────────────────────────────────────

/**
 * Desconta aulas do pack (o PT marca que o aluno fez uma ou mais aulas)
 *
 * @param {string} ptId
 * @param {object} pack  - objeto pack com id, client_id, sessions_remaining
 * @param {number} amount - número de aulas a descontar (default 1)
 * @param {string} [notes]
 */
export async function deductSessions(ptId, pack, amount = 1, notes = '') {
  if (pack.sessions_remaining < amount) {
    throw new Error('Saldo insuficiente para descontar esse número de aulas.');
  }

  const balanceBefore = pack.sessions_remaining;
  const balanceAfter  = balanceBefore - amount;

  const { error } = await supabase
    .from('client_packs')
    .update({ sessions_remaining: balanceAfter, updated_at: new Date().toISOString() })
    .eq('id', pack.id);

  if (error) throw error;

  await supabase.from('pack_transactions').insert([{
    pack_id: pack.id,
    client_id: pack.client_id,
    pt_id: ptId,
    type: 'deduct',
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    notes: notes || null,
  }]);

  return balanceAfter;
}

/**
 * Adiciona aulas ao pack (PT adiciona manualmente ou faz top-up)
 *
 * @param {string} ptId
 * @param {object} pack
 * @param {number} amount
 * @param {string} [notes]
 */
export async function addSessions(ptId, pack, amount, notes = '') {
  if (amount <= 0) throw new Error('O número de aulas a adicionar tem de ser positivo.');

  const balanceBefore = pack.sessions_remaining;
  const balanceAfter  = balanceBefore + amount;

  const { error } = await supabase
    .from('client_packs')
    .update({ sessions_remaining: balanceAfter, updated_at: new Date().toISOString() })
    .eq('id', pack.id);

  if (error) throw error;

  await supabase.from('pack_transactions').insert([{
    pack_id: pack.id,
    client_id: pack.client_id,
    pt_id: ptId,
    type: 'add',
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    notes: notes || null,
  }]);

  return balanceAfter;
}

/**
 * Renova manualmente o pack (para renewalType = 'manual')
 * Soma total_sessions ao saldo atual.
 *
 * @param {string} ptId
 * @param {object} pack
 * @param {string} [notes]
 */
export async function renewPackManually(ptId, pack, notes = '') {
  const balanceBefore = pack.sessions_remaining;
  const balanceAfter  = balanceBefore + pack.total_sessions;

  const { error } = await supabase
    .from('client_packs')
    .update({ sessions_remaining: balanceAfter, updated_at: new Date().toISOString() })
    .eq('id', pack.id);

  if (error) throw error;

  await supabase.from('pack_transactions').insert([{
    pack_id: pack.id,
    client_id: pack.client_id,
    pt_id: ptId,
    type: 'renewal',
    amount: pack.total_sessions,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    notes: notes || 'Renovação manual',
  }]);

  return balanceAfter;
}

/**
 * Desativa o pack ativo do aluno (cancelamento)
 */
export async function deactivatePack(packId) {
  const { error } = await supabase
    .from('client_packs')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', packId);

  if (error) throw error;
}

// ─── Helpers ────────────────────────────────────────────────

export const RENEWAL_LABELS = {
  monthly: 'Mensal',
  weekly:  'Semanal',
  manual:  'Manual',
};

export const TRANSACTION_LABELS = {
  deduct:  'Aula descontada',
  add:     'Aulas adicionadas',
  renewal: 'Renovação',
  create:  'Pack criado',
};

export const TRANSACTION_ICONS = {
  deduct:  'remove_circle',
  add:     'add_circle',
  renewal: 'autorenew',
  create:  'new_label',
};

export const TRANSACTION_COLORS = {
  deduct:  'text-error',
  add:     'text-[#1a7f64]',
  renewal: 'text-primary',
  create:  'text-primary',
};
