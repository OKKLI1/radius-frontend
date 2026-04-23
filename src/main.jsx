import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { C } from './theme'

const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background: var(--ax-bg, ${C.bg});
    color: var(--ax-text, ${C.text});
    font-family: 'Sora', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  :root {
    --ax-radius-sm: 10px;
    --ax-radius-md: 14px;
    --ax-radius-lg: 16px;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--ax-bg, ${C.bg}); }
  ::-webkit-scrollbar-thumb { background: var(--ax-border, ${C.border}); border-radius: 6px; }
  ::-webkit-scrollbar-thumb:hover { background: #4f5668; }

  input, select, textarea {
    transition: border-color 0.15s, box-shadow 0.15s;
    border-radius: var(--ax-radius-sm);
  }
  input:focus, select:focus, textarea:focus {
    border-color: var(--ax-accent, ${C.accent}) !important;
    box-shadow: 0 0 0 3px var(--ax-accent-dim, ${C.accentDim}) !important;
  }

  button {
    transition: opacity 0.15s, transform 0.1s;
    border-radius: var(--ax-radius-sm);
  }
  button:hover:not(:disabled) { opacity: 0.88; }
  button:active:not(:disabled) { transform: scale(0.98); }

  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .fade { animation: fadeIn 0.25s ease; }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
