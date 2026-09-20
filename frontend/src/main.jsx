import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ThemeToaster from './components/ThemeToaster'
import './index.css'
import './piramid.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ThemeToaster />
    </BrowserRouter>
  </React.StrictMode>
)
