import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: { background: '#0f2044', color: '#fff', fontSize: '13px', borderRadius: '8px' },
        success: { style: { background: '#166534' } },
        error:   { style: { background: '#991b1b' } },
      }}
    />
  </React.StrictMode>
)