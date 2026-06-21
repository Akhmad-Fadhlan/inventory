'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { borrowingsApi, assetsApi } from '@/lib/api';
import { 
  STATUS_LABELS, 
  CONDITION_LABELS, 
  STATUS_VARIANT, 
  ROLES,
  ASSET_CONDITION
} from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Providers';
import { 
  Plus, 
  SlidersHorizontal, 
  ArrowLeftRight, 
  CheckSquare, 
  Calendar,
  User,
  Tags
} from 'lucide-react';
import styles from './page.module.css';

export default function BorrowingsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal states
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [submittingBorrow, setSubmittingBorrow] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Active item for return
  const [activeAssetId, setActiveAssetId] = useState('');

  // Borrow Form state
  const [borrowForm, setBorrowForm] = useState({
    asset_id: '',
    borrower_name: '',
    borrower_position: '',
    planned_return_date: ''
  });

  // Return Form state
  const [returnForm, setReturnForm] = useState({
    condition: ASSET_CONDITION.GOOD
  });

  const fetchBorrowings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (page - 1) * limit,
        status: statusFilter || undefined,
      };

      const res = await borrowingsApi.list(params);
      if (res.success) {
        setBorrowings(res.data || []);
      } else {
        showToast(res.message || 'Gagal memuat daftar peminjaman', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, showToast]);

  useEffect(() => {
    if (session) {
      fetchBorrowings();
    }
  }, [session, fetchBorrowings]);

  const handleOpenBorrowModal = () => {
    setBorrowForm({
      asset_id: '',
      borrower_name: '',
      borrower_position: '',
      planned_return_date: ''
    });
    setIsBorrowModalOpen(true);
  };

  const handleOpenReturnModal = (assetId) => {
    setActiveAssetId(assetId);
    setReturnForm({
      condition: ASSET_CONDITION.GOOD
    });
    setIsReturnModalOpen(true);
  };

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!borrowForm.asset_id || !borrowForm.borrower_name || !borrowForm.borrower_position) {
      showToast('Mohon lengkapi semua field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmittingBorrow(true);
      const res = await borrowingsApi.borrow(borrowForm);
      if (res.success) {
        showToast('Aset berhasil dipinjam!', 'success');
        setIsBorrowModalOpen(false);
        fetchBorrowings();
      } else {
        showToast(res.message || 'Gagal memproses peminjaman', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmittingBorrow(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReturn(true);
      const res = await borrowingsApi.returnAsset({
        asset_id: activeAssetId,
        condition: returnForm.condition
      });
      if (res.success) {
        showToast('Aset berhasil dikembalikan!', 'success');
        setIsReturnModalOpen(false);
        fetchBorrowings();
      } else {
        showToast(res.message || 'Gagal mengembalikan aset', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const columns = [
    {
      key: 'borrow_id',
      label: 'ID Pinjam',
      width: '12%'
    },
    {
      key: 'asset_id',
      label: 'ID Aset',
      width: '15%'
    },
    {
      key: 'borrower_name',
      label: 'Peminjam',
      width: '20%',
      render: (item) => (
        <div className={styles.borrowerCell}>
          <span className={styles.borrowerName}>{item.borrower_name}</span>
          <span className={styles.borrowerPosition}>{item.borrower_position}</span>
        </div>
      )
    },
    {
      key: 'borrow_date',
      label: 'Tgl Pinjam',
      width: '13%',
      render: (item) => new Date(item.borrow_date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    },
    {
      key: 'planned_return_date',
      label: 'Rencana Kembali',
      width: '13%',
      render: (item) => item.planned_return_date ? new Date(item.planned_return_date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '—'
    },
    {
      key: 'actual_return_date',
      label: 'Tgl Kembali',
      width: '13%',
      render: (item) => item.actual_return_date ? new Date(item.actual_return_date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '—'
    },
    {
      key: 'status',
      label: 'Status',
      width: '8%',
      render: (item) => (
        <Badge variant={item.status === 'RETURNED' ? 'success' : 'info'}>
          {item.status === 'RETURNED' ? 'Dikembalikan' : 'Dipinjam'}
        </Badge>
      )
    },
    {
      key: 'action',
      label: 'Aksi',
      width: '8%',
      render: (item) => {
        if (item.status === 'RETURNED') return '—';
        return (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleOpenReturnModal(item.asset_id)}
            icon={<CheckSquare size={14} />}
          >
            Kembalikan
          </Button>
        );
      }
    }
  ];

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.header}>
        <div>
          <p className={styles.subtext}>Kelola riwayat peminjaman barang dan pengembalian aset sekolah.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleOpenBorrowModal}
          icon={<Plus size={18} />}
        >
          Pinjam Aset
        </Button>
      </div>

      {/* Filter Row */}
      <div className={styles.filterCard}>
        <div className={styles.filtersWrapper}>
          <SlidersHorizontal size={16} className={styles.slidersIcon} />
          
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={styles.filterSelect}
            aria-label="Filter status peminjaman"
          >
            <option value="">Semua Status</option>
            <option value="BORROWED">Sedang Dipinjam</option>
            <option value="RETURNED">Sudah Dikembalikan</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={columns}
          data={borrowings}
          loading={loading}
          emptyMessage="Tidak ada riwayat peminjaman aset"
          emptyIcon={ArrowLeftRight}
        />
      </div>

      {/* Pagination */}
      {!loading && borrowings.length > 0 && (
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
              disabled={borrowings.length < limit}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      <Modal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        title="Pinjam Aset Baru"
        size="sm"
      >
        <form onSubmit={handleBorrowSubmit} className={styles.form}>
          <div className={styles.formField}>
            <label htmlFor="asset_id">ID Aset*</label>
            <input 
              id="asset_id"
              type="text" 
              name="asset_id" 
              value={borrowForm.asset_id}
              onChange={(e) => setBorrowForm(prev => ({ ...prev, asset_id: e.target.value }))}
              placeholder="Contoh: CBG01-LAPTOP-0001" 
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="borrower_name">Nama Peminjam*</label>
            <input 
              id="borrower_name"
              type="text" 
              name="borrower_name" 
              value={borrowForm.borrower_name}
              onChange={(e) => setBorrowForm(prev => ({ ...prev, borrower_name: e.target.value }))}
              placeholder="Nama lengkap peminjam" 
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="borrower_position">Jabatan / Posisi Peminjam*</label>
            <input 
              id="borrower_position"
              type="text" 
              name="borrower_position" 
              value={borrowForm.borrower_position}
              onChange={(e) => setBorrowForm(prev => ({ ...prev, borrower_position: e.target.value }))}
              placeholder="Contoh: Guru Matematika, Staf TU" 
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="planned_return_date">Rencana Tanggal Pengembalian</label>
            <input 
              id="planned_return_date"
              type="date" 
              name="planned_return_date" 
              value={borrowForm.planned_return_date}
              onChange={(e) => setBorrowForm(prev => ({ ...prev, planned_return_date: e.target.value }))}
            />
          </div>

          <div className={styles.formActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsBorrowModalOpen(false)}
              disabled={submittingBorrow}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={submittingBorrow}
            >
              Simpan Peminjaman
            </Button>
          </div>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Pengembalian Aset"
        size="sm"
      >
        <form onSubmit={handleReturnSubmit} className={styles.form}>
          <div className={styles.returnPrompt}>
            <p>Konfirmasi pengembalian untuk aset dengan ID <strong>{activeAssetId}</strong>.</p>
            <p className={styles.returnPromptSub}>Silakan tentukan kondisi fisik akhir barang saat dikembalikan.</p>
          </div>

          <div className={styles.formField}>
            <label htmlFor="return_condition">Kondisi Barang Saat Kembali*</label>
            <select 
              id="return_condition"
              name="condition" 
              value={returnForm.condition}
              onChange={(e) => setReturnForm(prev => ({ ...prev, condition: e.target.value }))}
              required
            >
              <option value={ASSET_CONDITION.GOOD}>Baik (Siap Digunakan)</option>
              <option value={ASSET_CONDITION.MINOR_DAMAGE}>Kerusakan Ringan (Perlu Servis)</option>
              <option value={ASSET_CONDITION.MAJOR_DAMAGE}>Kerusakan Berat (Rusak Total)</option>
            </select>
          </div>

          <div className={styles.formActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsReturnModalOpen(false)}
              disabled={submittingReturn}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={submittingReturn}
            >
              Konfirmasi Kembali
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
