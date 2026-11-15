import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['Bicípite', 'Core', 'Costas', 'Ombro', 'Peito', 'Perna', 'Tricípite'];

// ─── Extrai o video ID do YouTube a partir de qualquer URL ────
function getYouTubeVideoId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let videoId = u.searchParams.get('v');
    if (!videoId && u.hostname === 'youtu.be') videoId = u.pathname.slice(1);
    if (!videoId && u.pathname.startsWith('/embed/')) videoId = u.pathname.split('/embed/')[1];
    if (!videoId && u.pathname.startsWith('/shorts/')) videoId = u.pathname.split('/shorts/')[1];
    return videoId || null;
  } catch {
    return null;
  }
}

function getYouTubeThumbnail(url) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// ─── Modal de edição de exercício ─────────────────────────────
function EditModal({ exercise, onClose, onSaved }) {
  const [name,      setName]      = useState(exercise.name);
  const [category,  setCategory]  = useState(exercise.category);
  const [equipment, setEquipment] = useState(exercise.equipment || '');
  const [demoUrl,   setDemoUrl]   = useState(exercise.demo_url || '');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [playing,   setPlaying]   = useState(false); // alterna thumbnail ↔ iframe

  const thumbnail = getYouTubeThumbnail(demoUrl);

  // Obter embed URL
  const getEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;
  };

  // Sempre que o URL muda, fecha o player para mostrar o novo thumbnail
  const handleDemoUrlChange = (val) => {
    setDemoUrl(val);
    setPlaying(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) {
      setError('Nome e categoria são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('exercises')
      .update({
        name:      name.trim(),
        category:  category.trim(),
        equipment: equipment.trim() || null,
        demo_url:  demoUrl.trim() || null,
      })
      .eq('id', exercise.id);

    if (err) {
      setError('Erro ao guardar: ' + err.message);
      setSaving(false);
      return;
    }
    onSaved({ ...exercise, name: name.trim(), category: category.trim(), equipment: equipment.trim() || null, demo_url: demoUrl.trim() || null });
    onClose();
  };

  const embedUrl = getEmbedUrl(demoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-surface rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Editar Exercício</p>
            <h3 className="font-black text-primary text-lg leading-tight mt-0.5 truncate max-w-[260px]">{exercise.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-1.5 pl-1">Nome</label>
            <input
              id="edit-name"
              name="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-4 py-3 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Categoria + Equipamento */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="edit-category" className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-1.5 pl-1">Categoria</label>
              <select
                id="edit-category"
                name="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-4 py-3 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                {!CATEGORIES.includes(category) && <option value={category}>{category}</option>}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="edit-equipment" className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-1.5 pl-1">Equipamento</label>
              <input
                id="edit-equipment"
                name="equipment"
                type="text"
                value={equipment}
                onChange={e => setEquipment(e.target.value)}
                placeholder="Ex: Barra, Halteres..."
                className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl px-4 py-3 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Demo URL */}
          <div>
            <label htmlFor="edit-demo-url" className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-1.5 pl-1">
              URL de Demonstração (YouTube)
            </label>
            <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/20 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20">
              <span className="material-symbols-outlined text-[#00677f]/60 text-lg flex-shrink-0">play_circle</span>
              <input
                id="edit-demo-url"
                name="demo_url"
                type="url"
                value={demoUrl}
                onChange={e => handleDemoUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-transparent font-medium text-sm text-primary focus:outline-none placeholder:text-outline/50"
              />
              {demoUrl && (
                <button type="button" onClick={() => { setDemoUrl(''); setPlaying(false); }} className="text-outline hover:text-error transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Preview: iframe quando playing, thumbnail quando não */}
            {thumbnail && (
              <div className="mt-3 relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                {playing && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Demo: ${name}`}
                  />
                ) : (
                  <>
                    <img src={thumbnail} alt="Thumbnail YouTube" className="w-full h-full object-cover opacity-90" />
                    {/* Botão de play — clica e troca para iframe */}
                    <button
                      type="button"
                      onClick={() => setPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center group"
                      aria-label="Reproduzir vídeo de demonstração"
                    >
                      <div className="w-14 h-14 bg-black/70 group-hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg">
                        <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                      </div>
                    </button>
                    <a
                      href={demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-black/80 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      Abrir no YouTube
                    </a>
                  </>
                )}
              </div>
            )}

            {demoUrl && !thumbnail && (
              <p className="text-error text-xs font-bold mt-2 pl-1">URL não reconhecida como YouTube válido.</p>
            )}
          </div>

          {error && (
            <div className="bg-error/10 text-error text-sm font-bold px-4 py-3 rounded-2xl border border-error/20" role="alert">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-surface-container text-on-surface-variant border border-outline-variant/20">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-on-primary shadow-md shadow-primary/20 active:scale-95 transition-all disabled:opacity-60">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function AdminExercises() {
  const navigate = useNavigate();
  const [exercises,      setExercises]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDemo,     setFilterDemo]     = useState('all'); // 'all' | 'with' | 'without'
  const [editing,        setEditing]        = useState(null);
  const [deleting,       setDeleting]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('id, name, category, equipment, demo_url, created_by')
      .order('category')
      .order('name');
    setExercises(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (updated) => {
    setExercises(prev => prev.map(ex => ex.id === updated.id ? updated : ex));
  };

  const handleDelete = async (ex) => {
    if (!window.confirm(`Eliminar "${ex.name}"?\n\nIsso removerá o exercício do catálogo. Planos que já o incluam não são afetados.`)) return;
    setDeleting(ex.id);
    await supabase.from('exercises').delete().eq('id', ex.id);
    setExercises(prev => prev.filter(e => e.id !== ex.id));
    setDeleting(null);
  };

  // ─── Filtros ───────────────────────────────────────────────
  const categories = Array.from(new Set(exercises.map(e => e.category))).sort();

  const filtered = exercises.filter(ex => {
    const matchSearch   = !search || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || ex.category === filterCategory;
    const matchDemo     = filterDemo === 'all'
      ? true
      : filterDemo === 'with'
        ? !!ex.demo_url
        : !ex.demo_url;
    return matchSearch && matchCategory && matchDemo;
  });

  const withDemo    = exercises.filter(e => e.demo_url).length;
  const withoutDemo = exercises.length - withDemo;

  return (
    <>
      {editing && (
        <EditModal
          exercise={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="space-y-5 pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform shadow-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest opacity-60">Admin</p>
            <h2 className="text-2xl font-black text-primary font-headline tracking-tighter">Gestão de Exercícios</h2>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary/10 rounded-[1.2rem] p-3 text-center">
            <p className="text-primary font-black text-2xl">{exercises.length}</p>
            <p className="text-primary/60 text-[10px] font-black uppercase tracking-wide mt-0.5">Total</p>
          </div>
          <div className="bg-[#1a7f64]/10 rounded-[1.2rem] p-3 text-center">
            <p className="text-[#1a7f64] font-black text-2xl">{withDemo}</p>
            <p className="text-[#1a7f64]/60 text-[10px] font-black uppercase tracking-wide mt-0.5">Com Demo</p>
          </div>
          <div className="bg-error/10 rounded-[1.2rem] p-3 text-center">
            <p className="text-error font-black text-2xl">{withoutDemo}</p>
            <p className="text-error/60 text-[10px] font-black uppercase tracking-wide mt-0.5">Sem Demo</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-2">
          {/* Pesquisa */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              id="search-exercises"
              name="search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar exercício..."
              aria-label="Pesquisar exercício"
              className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl pl-11 pr-5 py-3.5 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-error">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>

          {/* Categoria + Demo */}
          <div className="flex gap-2">
            <select
              id="filter-category"
              name="filter-category"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              aria-label="Filtrar por categoria"
              className="flex-1 bg-surface-container border border-outline-variant/20 rounded-2xl px-4 py-3 font-bold text-primary text-xs uppercase tracking-wider focus:outline-none"
            >
              <option value="">Todas as categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              id="filter-demo"
              name="filter-demo"
              value={filterDemo}
              onChange={e => setFilterDemo(e.target.value)}
              aria-label="Filtrar por demo"
              className="flex-1 bg-surface-container border border-outline-variant/20 rounded-2xl px-4 py-3 font-bold text-primary text-xs uppercase tracking-wider focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="with">Com demo</option>
              <option value="without">Sem demo</option>
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        {!loading && (
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-50 pl-1">
            {filtered.length} exercício{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-low p-8 rounded-[2rem] text-center border border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-outline mb-2 block">search_off</span>
            <p className="text-primary font-bold">Nenhum exercício encontrado</p>
            <p className="text-on-surface-variant text-sm mt-1">Tenta ajustar os filtros.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(ex => {
              const thumb = getYouTubeThumbnail(ex.demo_url);
              return (
                <div
                  key={ex.id}
                  className="bg-surface rounded-[1.5rem] border border-outline-variant/10 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4">
                    {/* Thumbnail ou placeholder */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0 relative">
                      {thumb ? (
                        <>
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-outline text-2xl">fitness_center</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-primary text-sm leading-tight truncate">{ex.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] font-black text-[#00677f] uppercase tracking-wider">{ex.category}</span>
                        {ex.equipment && (
                          <>
                            <span className="text-outline-variant/50 text-[10px]">·</span>
                            <span className="text-[10px] text-on-surface-variant">{ex.equipment}</span>
                          </>
                        )}
                      </div>
                      {ex.demo_url ? (
                        <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-black text-[#1a7f64]">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Demo configurada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-black text-error/70">
                          <span className="material-symbols-outlined text-xs">warning</span>
                          Sem demo
                        </span>
                      )}
                    </div>

                    {/* Acções */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setEditing(ex)}
                        className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 active:scale-90 transition-all"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(ex)}
                        disabled={deleting === ex.id}
                        className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center text-error hover:bg-error/20 active:scale-90 transition-all disabled:opacity-40"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {deleting === ex.id ? 'sync' : 'delete'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
