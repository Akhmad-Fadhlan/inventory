/**
 * API client for SISMA backend.
 * All requests go through /api/proxy to avoid CORS issues with GAS.
 */

async function request(endpoint, options = {}) {
  const { method = 'GET', body, params = {} } = options;

  const searchParams = new URLSearchParams({ endpoint });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const fetchOptions = {
    method,
    headers: {},
  };

  if (body && method !== 'GET') {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(`/api/proxy?${searchParams.toString()}`, fetchOptions);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data;
}

// === AUTH ===
export const authApi = {
  me: () => request('/api/v1/auth/me'),
  logout: () => request('/api/v1/auth/logout', { method: 'POST' }),
};

// === DASHBOARD ===
export const dashboardApi = {
  global: (force = false) =>
    request('/api/v1/dashboard', { params: { force } }),
  branch: (branchId, force = false) =>
    request('/api/v1/dashboard/branch', { params: { branch_id: branchId, force } }),
};

// === ASSETS ===
export const assetsApi = {
  list: (params = {}) =>
    request('/api/v1/assets', { params }),
  get: (id) =>
    request(`/api/v1/assets/${id}`),
  create: (body) =>
    request('/api/v1/assets', { method: 'POST', body }),
  update: (id, body) =>
    request(`/api/v1/assets/${id}`, { method: 'PUT', body }),
  delete: (id) =>
    request(`/api/v1/assets/${id}`, { method: 'DELETE' }),
  uploadPhoto: (assetId, photo) =>
    request('/api/v1/assets/upload-photo', { method: 'POST', body: { asset_id: assetId, photo } }),
  generateQr: (assetId) =>
    request('/api/v1/assets/generate-qr', { method: 'POST', body: { asset_id: assetId } }),
};

// === BORROWINGS ===
export const borrowingsApi = {
  list: (params = {}) =>
    request('/api/v1/borrowings', { params }),
  borrow: (body) =>
    request('/api/v1/borrowings', { method: 'POST', body }),
  returnAsset: (body) =>
    request('/api/v1/borrowings/return', { method: 'POST', body }),
};

// === MAINTENANCES ===
export const maintenanceApi = {
  list: (params = {}) =>
    request('/api/v1/maintenances', { params }),
  create: (body) =>
    request('/api/v1/maintenances', { method: 'POST', body }),
  update: (id, body) =>
    request(`/api/v1/maintenances/${id}`, { method: 'PUT', body }),
};

// === INSPECTIONS ===
export const inspectionsApi = {
  list: (params = {}) =>
    request('/api/v1/inspections', { params }),
  create: (body) =>
    request('/api/v1/inspections', { method: 'POST', body }),
};

// === TRANSFERS ===
export const transfersApi = {
  list: (params = {}) =>
    request('/api/v1/transfers', { params }),
  create: (body) =>
    request('/api/v1/transfers', { method: 'POST', body }),
};

// === REPORTS ===
export const reportsApi = {
  assets: (params = {}) =>
    request('/api/v1/reports/assets', { params }),
  borrowings: (params = {}) =>
    request('/api/v1/reports/borrowings', { params }),
  maintenances: (params = {}) =>
    request('/api/v1/reports/maintenances', { params }),
  opname: (params = {}) =>
    request('/api/v1/reports/opname', { params }),
};
