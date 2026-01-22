import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import App from './App'
import { SurveySessionProvider } from './lib/surveySession'
import './index.css'
import theme from './theme'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SurveySessionProvider>
          <App />
        </SurveySessionProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
