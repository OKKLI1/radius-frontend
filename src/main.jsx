import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background: #1a1d23;
    color: #e8eaf0;
    font-family: 'Sora', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #1a1d23; }
  ::-webkit-scrollbar-thumb { background: #353a47; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #4f5668; }

  input, select, textarea {
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  input:focus, select:focus, textarea:focus {
    border-color: #4f8ef7 !important;
    box-shadow: 0 0 0 3px #4f8ef715 !important;
  }

  button { transition: opacity 0.15s, transform 0.1s; }
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
