import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={{
      style: { fontSize: '13px', borderRadius: '10px' },
      success: { style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' }},
      error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' }},
    }}/>
  </React.StrictMode>
)
