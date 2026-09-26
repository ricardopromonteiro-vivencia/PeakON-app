import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadPhotoAndLog } from '../lib/api';

export default function LogPhoto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const max = 1080;
          
          if (width > height && width > max) {
            height = Math.round((height * max) / width);
            width = max;
          } else if (height > max) {
            width = Math.round((width * max) / height);
            height = max;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
      try {
        const compressed = await compressImage(selectedFile);
        setFile(compressed);
      } catch(e) {
        setFile(selectedFile);
        console.warn('Falha na compressão, enviando original:', e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      await uploadPhotoAndLog(id, file);
      navigate(`/client/${id}`, { replace: true });
    } catch (e) {
      alert("Certifica-te que criaste o bucket 'photos' no Supabase Storage: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-3xl font-black text-primary font-headline tracking-tighter">Nova Foto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-8 pb-32">
        <div className="bg-surface-container border border-outline-variant/10 rounded-[2rem] p-6 text-center shadow-inner h-[60vh] max-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
          {preview ? (
            <img src={preview} alt="Upload Preview" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <span className="material-symbols-outlined text-6xl text-outline mb-4">add_photo_alternate</span>
              <p className="text-on-surface-variant font-bold">Toca para selecionar uma foto<br/>da galeria ou câmara.</p>
            </>
          )}
          
          <input 
            type="file" 
            accept="image/*"
            ref={fileInputRef}
            onChange={handleSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !file}
          className="w-full py-5 bg-primary text-on-primary rounded-full font-black text-xl uppercase tracking-wider shadow-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'A Enviar...' : <><span className="material-symbols-outlined">cloud_upload</span>Guardar Foto</>}
        </button>
      </form>
    </div>
  );
}
