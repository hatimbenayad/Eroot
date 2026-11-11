import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
      <h1 className="text-2xl font-bold">Eroot</h1>
    </main>
  </StrictMode>
);

