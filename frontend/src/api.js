const BASE = 'http://localhost:3001/api'

function getToken() {
  return localStorage.getItem('bt_token')
}

async function req(path, options = {}) {
  const token = getToken()
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (res.status === 401) {
    localStorage.removeItem('bt_token')
    localStorage.removeItem('bt_user')
    window.location.href = '/login'
    return
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  login:              (u, p)      => req('/auth/login', { method: 'POST', body: { username: u, password: p } }),
  getUsers:           ()          => req('/users'),
  addUser:            (d)         => req('/users', { method: 'POST', body: d }),
  deleteUser:         (id)        => req('/users/' + id, { method: 'DELETE' }),
  getAnalytics:       ()          => req('/analytics'),
  getInservice:       (p)         => req('/inservice?' + new URLSearchParams(p)),
  addInservice:       (d)         => req('/inservice', { method: 'POST', body: d }),
  updateInservice:    (id, d)     => req('/inservice/' + id, { method: 'PUT', body: d }),
  deleteInservice:    (id)        => req('/inservice/' + id, { method: 'DELETE' }),
  getPreservice:      (p)         => req('/preservice?' + new URLSearchParams(p)),
  addPreservice:      (d)         => req('/preservice', { method: 'POST', body: d }),
  updatePreservice:   (id, d)     => req('/preservice/' + id, { method: 'PUT', body: d }),
  deletePreservice:   (id)        => req('/preservice/' + id, { method: 'DELETE' }),
  getRecruitment:     (p)         => req('/recruitment?' + new URLSearchParams(p)),
  addRecruitment:     (d)         => req('/recruitment', { method: 'POST', body: d }),
  updateRecruitment:  (id, d)     => req('/recruitment/' + id, { method: 'PUT', body: d }),
  deleteRecruitment:  (id)        => req('/recruitment/' + id, { method: 'DELETE' }),
  getSBDrivers:       (p)         => req('/schoolbus/drivers?' + new URLSearchParams(p)),
  addSBDriver:        (d)         => req('/schoolbus/drivers', { method: 'POST', body: d }),
  updateSBDriver:     (id, d)     => req('/schoolbus/drivers/' + id, { method: 'PUT', body: d }),
  deleteSBDriver:     (id)        => req('/schoolbus/drivers/' + id, { method: 'DELETE' }),
  getSBSupervisors:   (p)         => req('/schoolbus/supervisors?' + new URLSearchParams(p)),
  addSBSupervisor:    (d)         => req('/schoolbus/supervisors', { method: 'POST', body: d }),
  updateSBSupervisor: (id, d)     => req('/schoolbus/supervisors/' + id, { method: 'PUT', body: d }),
  deleteSBSupervisor: (id)        => req('/schoolbus/supervisors/' + id, { method: 'DELETE' }),
  uploadCSV:          (type, csv) => req('/upload/csv', { method: 'POST', body: { type, csvData: csv } }),
}
