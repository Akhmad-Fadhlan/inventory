'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { borrowingsApi } from '@/lib/api';
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
  ArrowLeftRight, 
  Plus, 
  RotateCcw, 
  Calendar,
  User,
  SlidersHorizontal,
  Search
} from 'lucide-react';
import styles from './page.module.css';

export default function BorrowingsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [borrowForm, setBorrowForm] = useState({
    asset_id: '',
    borrower_name: '',
    borrower_position: '',
    planned_return_date: ''
  });

  const [returnForm, setReturnForm] = useState({
    asset_id: '',
    condition: ASSET_CONDITION.GOOD
  });

  const [selectedBorrowing, setSelectedBorrowing] = useState(null);

  const fetchBorrowings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter || undefined,
        search: searchTerm || undefined
      };
      const res = await borrowingsApi.list(params);
      if (res.success) {
        setBorrowings(res.data || []);
      } else {
        showToast(res.message || 'Gagal memuat data peminjaman', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, showToast]);

  useEffect(() => {
    if (session) {
      fetchBorrowings();
    }
  }, [session, fetchBorrowings]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const handleBorrowInputChange = (e) => {
    const { name, value } = e.target;
    setBorrowForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!borrowForm.asset_id || !borrowForm.borrower_name || !borrowForm.borrower_position) {
      showToast('Mohon lengkapi field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await borrowingsApi.borrow(borrowForm);
      if (res.success) {
        showToast('Peminjaman aset berhasil dicatat!', 'success');
        setIsBorrowModalOpen(false);
        fetchBorrowings();
      } else {
        showToast(res.message || 'Gagal memproses peminjaman', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReturnModal = (item) => {
    setSelectedBorrowing(item);
    setReturnForm({
      asset_id: item.asset_id,
      condition: ASSET_CONDITION.GOOD
    });
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await borrowingsApi.returnAsset(returnForm);
      if (res.success) {
        showToast('Pengembalian aset berhasil dicatat!', 'success');
        setIsReturnModalOpen(false);
        fetchBorrowings();
      } else {
        showToast(res.message || 'Gagal memproses pengembalian', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenBorrowModal = () => {
    setBorrowForm({
      asset_id: '',
      borrower_name: '',
      borrower_position: '',
      planned_return_date: ''
    });
    setIsBorrowModalOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
      render: (item) => formatDate(item.borrow_date)
    },
    {
      key: 'planned_return_date',
      label: 'Tgl Rencana Kembali',
      width: '15%',
      render: (item) => (
        <span className={item.status === 'BORROWED' && new Date(item.planned_return_date) < new Date() ? styles.overdue : ''}>
          {formatDate(item.planned_return_date)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (item) => (
        <Badge variant={item.status === 'BORROWED' ? 'info' : 'success'}>
          {item.status === 'BORROWED' ? 'Sedang Dipinjam' : 'Dikembalikan'}
        </Badge>
      )
    },
    {
      key: 'action',
      label: 'Aksi',
      width: '13%',
      render: (item) => {
        if (item.status === 'BORROWED') {
          return (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => handleOpenReturnModal(item)}
              icon={<RotateCcw size={14} />}
            >
              Kembalikan
            </Button>
          );
        }
        return <span className={styles.returnDateText}>Tgl Kembali: {formatDate(item.actual_return_date)}</span>;
      }
    }
  ];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.subtext}>Monitor dan catat aktivitas peminjaman dan pengembalian aset sekolah.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleOpenBorrowModal}
          icon={<Plus size={18} />}
        >
          Pinjam Aset
        </Button>
      </div>

      {/* Filter Card */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan ID Aset, ID Pinjam, atau nama peminjam..." 
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filtersWrapper}>
          <SlidersHorizontal size={16} className={styles.slidersIcon} />
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter status peminjaman"
          >
            <option value="">Semua Status</option>
            <option value="BORROWED">Sedang Dipinjam</option>
            <option value="RETURNED">Sudah Dikembalikan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={columns}
          data={borrowings}
          loading={loading}
          emptyMessage="Tidak ada data transaksi peminjaman ditemukan"
          emptyIcon={ArrowLeftRight}
        />
      </div>

      {/* Borrow Modal */}
      <Modal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        title="Formulir Peminjaman Aset"
        size="md"
      >
        <form onSubmit={handleBorrowSubmit} className={styles.form}>
          <div className={styles.formField}>
            <label htmlFor="asset_id">ID Aset / Kode Barang*</label>
            <input 
              id="asset_id"
              type="text" 
              name="asset_id" 
              value={borrowForm.asset_id}
              onChange={handleBorrowInputChange}
              placeholder="Contoh: CBG01-LAPTOP-0001" 
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="borrower_name">Nama Peminjam*</label>
              <input 
                id="borrower_name"
                type="text" 
                name="borrower_name" 
                value={borrowForm.borrower_name}
                onChange={handleBorrowInputChange}
                placeholder="Nama lengkap peminjam" 
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="borrower_position">Jabatan / Bagian*</label>
              <input 
                id="borrower_position"
                type="text" 
                name="borrower_position" 
                value={borrowForm.borrower_position}
                onChange={handleBorrowInputChange}
                placeholder="Contoh: Guru Matematika" 
                required
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label htmlFor="planned_return_date">Tanggal Rencana Kembali</label>
            <input 
              id="planned_return_date"
              type="date" 
              name="planned_return_date" 
              value={borrowForm.planned_return_date}
              onChange={handleBorrowInputChange}
            />
          </div>

          <div className={styles.formActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsBorrowModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={submitting}
            >
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Konfirmasi Pengembalian Aset"
        size="sm"
      >
        {selectedBorrowing && (
          <form onSubmit={handleReturnSubmit} className={styles.form}>
            <div className={styles.returnInfo}>
              <p>Mengembalikan aset:</p>
              <strong>{selectedBorrowing.asset_id}</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-foreground-muted)', marginTop: '4px' }}>
                Dipinjam oleh: {selectedBorrowing.borrower_name}
              </p>
            </div>

            <div className={styles.formField}>
              <label htmlFor="condition">Kondisi Fisik Saat Kembali*</label>
              <select 
                id="condition"
                value={returnForm.condition}
                onChange={(e) => setReturnForm(prev => ({ ...prev, condition: e.target.value }))}
                required
              >
                <option value={ASSET_CONDITION.GOOD}>Baik (Kembali Tersedia)</option>
                <option value={ASSET_CONDITION.MINOR_DAMAGE}>Rusak Ringan (Masuk Daftar Perbaikan)</option>
                <option value={ASSET_CONDITION.MAJOR_DAMAGE}>Rusak Berat (Masuk Daftar Rusak)</option>
              </select>
            </div>

            <div className={styles.formActions}>
              <Button 
                variant="ghost" 
                onClick={() => setIsReturnModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                variant="primary"
                loading={submitting}
              >
                Konfirmasi Kembali
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
