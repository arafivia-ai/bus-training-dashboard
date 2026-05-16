const BASE = 'https://bus-training-api.onrender.com/api'

function getToken() { return localStorage.getItem('bt_token') }

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
  // Auth
  login:                 (u,p)  => req('/auth/login', { method:'POST', body:{ username:u, password:p } }),

  // Users
  getUsers:              ()     => req('/users'),
  addUser:               (d)    => req('/users', { method:'POST', body:d }),
  deleteUser:            (id)   => req('/users/'+id, { method:'DELETE' }),

  // Analytics
  getAnalytics:          ()     => req('/analytics'),

  // Filters
  getInserviceFilters:   ()     => req('/inservice/filters'),
  getPreserviceFilters:  ()     => req('/preservice/filters'),
  getRecruitmentFilters: ()     => req('/recruitment/filters'),
  getTaxiFilters:        ()     => req('/taxi/filters'),
  getSchoolBusFilters:   ()     => req('/schoolbus/filters'),

  // In-Service
  getInservice:          (p={}) => req('/inservice?' + new URLSearchParams(p)),
  addInservice:          (d)    => req('/inservice', { method:'POST', body:d }),
  deleteInservice:       (id)   => req('/inservice/'+id, { method:'DELETE' }),

  // Pre-Service
  getPreservice:         (p={}) => req('/preservice?' + new URLSearchParams(p)),
  addPreservice:         (d)    => req('/preservice', { method:'POST', body:d }),
  deletePreservice:      (id)   => req('/preservice/'+id, { method:'DELETE' }),

  // Recruitment
  getRecruitment:        (p={}) => req('/recruitment?' + new URLSearchParams(p)),
  addRecruitment:        (d)    => req('/recruitment', { method:'POST', body:d }),
  deleteRecruitment:     (id)   => req('/recruitment/'+id, { method:'DELETE' }),

  // Taxi & Limousine
  getTaxi:               (p={}) => req('/taxi?' + new URLSearchParams(p)),
  addTaxi:               (d)    => req('/taxi', { method:'POST', body:d }),
  deleteTaxi:            (id)   => req('/taxi/'+id, { method:'DELETE' }),

  // School Bus
  getSchoolBus:          (p={}) => req('/schoolbus?' + new URLSearchParams(p)),
  deleteSchoolBus:       (id)   => req('/schoolbus/'+id, { method:'DELETE' }),

  // CSV Upload
  uploadCSV:             (type,csv) => req('/upload/csv', { method:'POST', body:{ type, csvData:csv } }),
}