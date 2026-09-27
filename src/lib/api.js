import { supabase } from './supabase';

export async function getClients(userId) {
  const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getClientById(id) {
  const { data, error } = await supabase.from('clients').select(`*, workout_plans(name)`).eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function addClient(userId, clientData) {
  const { data, error } = await supabase.from('clients').insert([{ user_id: userId, ...clientData }]).select().single();
  if (error) throw error;
  return data;
}

export async function getClientTimeline(clientId) {
  const [workouts, progress, photos, metrics, plans] = await Promise.all([
    supabase.from('workouts').select('*').eq('client_id', clientId),
    supabase.from('progress_logs').select('*').eq('client_id', clientId),
    supabase.from('photos').select('*').eq('client_id', clientId),
    supabase.from('body_metrics').select('*').eq('client_id', clientId),
    supabase.from('plan_assignments').select('*').eq('client_id', clientId),
  ]);
  
  const timeline = [
    ...(workouts.data || []).map(w => ({ ...w, type: 'workout',      sortDate: w.date })),
    ...(progress.data || []).map(p => ({ ...p, type: 'progress',     sortDate: p.created_at })),
    ...(photos.data   || []).map(p => ({ ...p, type: 'photo',        sortDate: p.created_at })),
    ...(metrics.data  || []).map(m => ({ ...m, type: 'metrics',      sortDate: m.created_at })),
    ...(plans.data    || []).map(a => ({ ...a, type: 'plan_assigned', sortDate: a.created_at })),
  ].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
  
  return timeline;
}

export async function logWorkout(userId, clientId, data) {
  const { error } = await supabase.from('workouts').insert([{ user_id: userId, client_id: clientId, ...data }]);
  if (error) throw error;
}

export async function logProgress(clientId, data) {
  const { error } = await supabase.from('progress_logs').insert([{ client_id: clientId, ...data }]);
  if (error) throw error;
}

export async function uploadPhotoAndLog(clientId, file) {
  const filename = `${clientId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('Photos').upload(filename, file);
  
  if (uploadError) throw uploadError;
  
  const { data: urlData } = supabase.storage.from('Photos').getPublicUrl(filename);
  
  const { error } = await supabase.from('photos').insert([{ client_id: clientId, image_url: urlData.publicUrl }]);
  if (error) throw error;
}
