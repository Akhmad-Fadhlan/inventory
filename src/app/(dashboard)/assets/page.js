'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { assetsApi } from '@/lib/api';
import { 
  STATUS_LABELS, 
  CONDITION_LABELS, 
  STATUS_VARIANT, 
  ROLES,
  ASSET_STATUS,
  ASSET_CONDITION
} from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Providers';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Eye, 
  PackageOpen, 
  FileText
} from 'lucide-react';
import styles from './page.module.css';

// Mock list selections for drop-downs
const CATEGORY_OPTIONS = [
  { id: 'LAPTOP', label: 'Laptop' },
  { id: 'PROYEKTOR', label: 'Proyektor' },
  { id: 'KURSI', label: 'Kursi' },
  { id: 'MEJA', label: 'Meja' },
  { id: 'AC', label: 'AC / Pendingin Ruangan' },
  { id: 'LAINNYA', label: 'Lain-lain' },
];

const BRANCH_OPTIONS = [
  { id: 'CBG01', label: 'Cabang Utama' },
  { id: 'CBG02', label: 'Cabang Pembantu' },
  { id: 'CBG03', label: 'Cabang Khusus' },
];

const ROOM_OPTIONS = [
  { id: 'RUANG_KELAS_1', label: 'Ruang Kelas 1' },
  { id: 'LAB_KOMPUTER', label: 'Lab Komputer' },
  { id: 'RUANG_GURU', label: 'Ruang Guru' },
  { id: 'AULA', label: 'Aula' },
];

const PIC_OPTIONS = [
  { id: 'USR001', label: 'Pak Budi' },
  { id: 'USR002', label: 'Ibu Ani' },
  { id: 'USR003', label: 'Pak Eko' },
];

export default function AssetsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Add Asset modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    item_name: '',
    category_id: '',
    branch_id: '',
    room_id: '',
    pic_id: '',
    brand: '',
    serial_number: '',
    notes: ''
  });

  const userRole = session?.user?.role;
  const isWritable = userRole === ROLES.SUPER_ADMIN || userRole === ROLES.BRANCH_ADMIN;

  // Initialize and default branch_id in form if user is branch admin
  useEffect(() => {
    if (session?.user && userRole === ROLES.BRANCH_ADMIN) {
      setForm((prev) => ({ ...prev, branch_id: session.user.branch_id }));
    }
  }, [session, userRole]);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (page - 1) * limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        condition: conditionFilter || undefined,
        category_id: categoryFilter || undefined,
      };

      const res = await assetsApi.list(params);
      if (res.success) {
        setAssets(res.data || []);
      } else {
        showToast(res.message || 'Gagal memuat daftar aset', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, conditionFilter, categoryFilter, showToast]);

  useEffect(() => {
    if (session) {
      fetchAssets();
    }
  }, [session, fetchAssets]);

  // Debounced search handler (simple local implementation)
  const [searchVal, setSearchVal] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchVal);
      setPage(1); // Reset page on search
    }, 300);

    return () => clearTimeout(handler);
  }, [searchVal]);

  const handleOpenAddModal = () => {
    setForm({
      item_name: '',
      category_id: '',
      branch_id: userRole === ROLES.BRANCH_ADMIN ? session.user.branch_id : '',
      room_id: '',
      pic_id: '',
      brand: '',
      serial_number: '',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.category_id || !form.branch_id || !form.room_id || !form.pic_id) {
      showToast('Mohon lengkapi semua field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await assetsApi.create(form);
      if (res.success) {
        showToast('Aset berhasil ditambahkan!', 'success');
        setIsAddModalOpen(false);
        fetchAssets();
      } else {
        showToast(res.message || 'Gagal menambahkan aset', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'asset_id',
      label: 'ID Aset',
      width: '15%'
    },
    {
      key: 'item_name',
      label: 'Nama Aset',
      width: '25%',
      render: (item) => (
        <div className={styles.itemNameCell}>
          <span className={styles.itemName}>{item.item_name}</span>
          <span className={styles.itemBrand}>{item.brand || 'Tanpa Merek'}</span>
        </div>
      )
    },
    {
      key: 'category_id',
      label: 'Kategori',
      width: '12%',
      render: (item) => CATEGORY_OPTIONS.find(c => c.id === item.category_id)?.label || item.category_id
    },
    {
      key: 'room_id',
      label: 'Lokasi',
      width: '18%',
      render: (item) => {
        const branchLabel = BRANCH_OPTIONS.find(b => b.id === item.branch_id)?.label || item.branch_id;
        const roomLabel = ROOM_OPTIONS.find(r => r.id === item.room_id)?.label || item.room_id;
        return `${branchLabel} — ${roomLabel}`;
      }
    },
    {
      key: 'condition',
      label: 'Kondisi',
      width: '12%',
      render: (item) => (
        <Badge variant={STATUS_VARIANT[item.condition] || 'default'}>
          {CONDITION_LABELS[item.condition] || item.condition}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (item) => (
        <Badge variant={STATUS_VARIANT[item.status] || 'default'}>
          {STATUS_LABELS[item.status] || item.status}
        </Badge>
      )
    },
    {
      key: 'action',
      label: 'Aksi',
      width: '8%',
      render: (item) => (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/assets/${item.asset_id}`);
          }}
          icon={<Eye size={14} />}
        >
          Detail
        </Button>
      )
    }
  ];

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.subtext}>Kelola dan monitor seluruh aset serta inventaris sekolah.</p>
        </div>
        {isWritable && (
          <Button 
            variant="primary" 
            onClick={handleOpenAddModal}
            icon={<Plus size={18} />}
          >
            Tambah Aset
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan ID, nama, merek, atau no. seri..." 
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filtersWrapper}>
          <SlidersHorizontal size={16} className={styles.slidersIcon} />
          
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={styles.filterSelect}
            aria-label="Filter status"
          >
            <option value="">Semua Status</option>
            <option value={ASSET_STATUS.AVAILABLE}>Tersedia</option>
            <option value={ASSET_STATUS.BORROWED}>Dipinjam</option>
            <option value={ASSET_STATUS.MAINTENANCE}>Perbaikan</option>
            <option value={ASSET_STATUS.DAMAGED}>Rusak</option>
          </select>

          <select 
            value={conditionFilter} 
            onChange={(e) => { setConditionFilter(e.target.value); setPage(1); }}
            className={styles.filterSelect}
            aria-label="Filter kondisi"
          >
            <option value="">Semua Kondisi</option>
            <option value={ASSET_CONDITION.GOOD}>Baik</option>
            <option value={ASSET_CONDITION.MINOR_DAMAGE}>Kerusakan Ringan</option>
            <option value={ASSET_CONDITION.MAJOR_DAMAGE}>Kerusakan Berat</option>
          </select>

          <select 
            value={categoryFilter} 
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className={styles.filterSelect}
            aria-label="Filter kategori"
          >
            <option value="">Semua Kategori</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={columns}
          data={assets}
          onRowClick={(item) => router.push(`/assets/${item.asset_id}`)}
          loading={loading}
          emptyMessage="Tidak ada data aset ditemukan"
          emptyIcon={PackageOpen}
        />
      </div>

      {/* Pagination */}
      {!loading && assets.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.pageIndicator}>
            Halaman <strong>{page}</strong>
          </span>
          <div className={styles.paginationButtons}>
            <Button 
              variant="ghost" 
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              disabled={assets.length < limit}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Tambah Aset Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Aset Baru"
        size="md"
      >
        <form onSubmit={handleFormSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="item_name">Nama Barang*</label>
              <input 
                id="item_name"
                type="text" 
                name="item_name" 
                value={form.item_name}
                onChange={handleInputChange}
                placeholder="Contoh: Laptop ASUS ROG" 
                required
              />
            </div>
            
            <div className={styles.formField}>
              <label htmlFor="category_id">Kategori*</label>
              <select 
                id="category_id"
                name="category_id" 
                value={form.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Pilih Kategori</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="branch_id">Cabang*</label>
              <select 
                id="branch_id"
                name="branch_id" 
                value={form.branch_id}
                onChange={handleInputChange}
                disabled={userRole === ROLES.BRANCH_ADMIN}
                required
              >
                <option value="">Pilih Cabang</option>
                {BRANCH_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="room_id">Ruangan*</label>
              <select 
                id="room_id"
                name="room_id" 
                value={form.room_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Pilih Ruangan</option>
                {ROOM_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="pic_id">Penanggung Jawab (PIC)*</label>
              <select 
                id="pic_id"
                name="pic_id" 
                value={form.pic_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Pilih PIC</option>
                {PIC_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="brand">Merek</label>
              <input 
                id="brand"
                type="text" 
                name="brand" 
                value={form.brand}
                onChange={handleInputChange}
                placeholder="Contoh: ASUS" 
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label htmlFor="serial_number">Nomor Seri</label>
            <input 
              id="serial_number"
              type="text" 
              name="serial_number" 
              value={form.serial_number}
              onChange={handleInputChange}
              placeholder="Contoh: SN-829304729" 
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="notes">Catatan Tambahan</label>
            <textarea 
              id="notes"
              name="notes" 
              value={form.notes}
              onChange={handleInputChange}
              placeholder="Tambahkan detail kondisi awal atau info tambahan..."
              rows={3}
            />
          </div>

          <div className={styles.formActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsAddModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={submitting}
            >
              Simpan Aset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
