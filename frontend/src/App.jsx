import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import Layout      from './components/Layout'
import Login       from './pages/Login'
import Home        from './pages/Home'
import InService   from './pages/InService'
import PreService  from './pages/PreService'
import Recruitment from './pages/Recruitment'
import SBDrivers   from './pages/SBDrivers'
import SBSupervisors from './pages/SBSupervisors'
import Analytics   from './pages/Analytics'
import Settings    from './pages/Settings'

function Guard({ children }) {
  const user = useStore(s => s.user)
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index            element={<Home />} />
          <Route path="inservice"    element={<InService />} />
          <Route path="preservice"   element={<PreService />} />
          <Route path="recruitment"  element={<Recruitment />} />
          <Route path="sb-drivers"   element={<SBDrivers />} />
          <Route path="sb-supervisors" element={<SBSupervisors />} />
          <Route path="analytics"    element={<Analytics />} />
          <Route path="settings"     element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
