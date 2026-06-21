/**
 * Frontend constants mirroring SISMA backend enums.
 * All labels in Bahasa Indonesia.
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  TEACHER: 'TEACHER',
};

export const ASSET_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BORROWED: 'BORROWED',
  MAINTENANCE: 'MAINTENANCE',
  DAMAGED: 'DAMAGED',
  DELETED: 'DELETED',
};

export const ASSET_CONDITION = {
  GOOD: 'GOOD',
  MINOR_DAMAGE: 'MINOR_DAMAGE',
  MAJOR_DAMAGE: 'MAJOR_DAMAGE',
};

export const TRANSACTION_TYPE = {
  CREATE: 'CREATE',
  BORROW: 'BORROW',
  RETURN: 'RETURN',
  MAINTENANCE_START: 'MAINTENANCE_START',
  MAINTENANCE_END: 'MAINTENANCE_END',
  TRANSFER: 'TRANSFER',
  DELETE: 'DELETE',
};

// Bahasa Indonesia labels
export const STATUS_LABELS = {
  AVAILABLE: 'Tersedia',
  BORROWED: 'Dipinjam',
  MAINTENANCE: 'Perbaikan',
  DAMAGED: 'Rusak',
  DELETED: 'Dihapus',
  PENDING: 'Menunggu',
  COMPLETED: 'Selesai',
  RETURNED: 'Dikembalikan',
};

export const CONDITION_LABELS = {
  GOOD: 'Baik',
  MINOR_DAMAGE: 'Kerusakan Ringan',
  MAJOR_DAMAGE: 'Kerusakan Berat',
};

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  BRANCH_ADMIN: 'Admin Cabang',
  TEACHER: 'Guru',
};

export const TRANSACTION_LABELS = {
  CREATE: 'Pembuatan',
  BORROW: 'Peminjaman',
  RETURN: 'Pengembalian',
  MAINTENANCE_START: 'Mulai Perbaikan',
  MAINTENANCE_END: 'Selesai Perbaikan',
  TRANSFER: 'Transfer',
  DELETE: 'Penghapusan',
  INSPECT: 'Inspeksi',
};

export const STATUS_VARIANT = {
  AVAILABLE: 'success',
  BORROWED: 'info',
  MAINTENANCE: 'warning',
  DAMAGED: 'danger',
  DELETED: 'default',
  PENDING: 'warning',
  COMPLETED: 'success',
  RETURNED: 'success',
  GOOD: 'success',
  MINOR_DAMAGE: 'warning',
  MAJOR_DAMAGE: 'danger',
};

/**
 * Sidebar navigation items with role-based visibility.
 */
export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TEACHER] },
  { label: 'Aset', href: '/assets', icon: 'Package', roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TEACHER] },
  { label: 'Peminjaman', href: '/borrowings', icon: 'ArrowLeftRight', roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TEACHER] },
  { label: 'Perbaikan', href: '/maintenance', icon: 'Wrench', roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN] },
  { label: 'Inspeksi', href: '/inspections', icon: 'ClipboardCheck', roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN] },
  { label: 'Transfer', href: '/transfers', icon: 'Truck', roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN] },
  { label: 'Laporan', href: '/reports', icon: 'FileBarChart', roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TEACHER] },
];
