'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { transfersApi } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Providers';
import { 
  Plus, 
  Truck, 
  Calendar,
  User,
  ArrowRight,
  MapPin
} from 'lucide-react';
import styles from './page.module.css';

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

export default function TransfersPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    asset_id: '',
    to_branch: '',
    to_room: '',
    new_pic: ''
  });

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (page - 1) * limit
      };

      const res = await transfersApi.list(params);
      if (res.success) {
        setTransfers(res.data || []);
      } else {
        showToast(res.message || 'Gagal memuat riwayat transfer', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    if (session) {
      fetchTransfers();
    }
  }, [session, fetchTransfers]);

  const handleOpenModal = () => {
    setForm({
      asset_id: '',
      to_branch: '',
      to_room: '',
      new_pic: ''
    });
    setIsOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_id || !form.to_branch || !form.to_room || !form.new_pic) {
      showToast('Mohon isi semua field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await transfersApi.create(form);
      if (res.success) {
        showToast('Aset berhasil ditransfer!', 'success');
        setIsOpen(false);
        fetchTransfers();
      } else {
        showToast(res.message || 'Gagal melakukan transfer aset', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getBranchLabel = (id) => BRANCH_OPTIONS.find(b => b.id === id)?.label || id;
  const getRoomLabel = (id) => ROOM_OPTIONS.find(r => r.id === id)?.label || id;
  const getPicLabel = (id) => PIC_OPTIONS.find(p => p.id === id)?.label || id;

  const columns = [
    {
      key: 'transfer_id',
      label: 'ID Transfer',
      width: '12%'
    },
    {
      key: 'asset_id',
      label: 'ID Aset',
      width: '15%'
    },
    {
      key: 'branch_transfer',
      label: 'Transfer Cabang',
      width: '25%',
      render: (item) => (
        <div className={styles.routeCell}>
          <span className={styles.routeSource}>{getBranchLabel(item.from_branch)}</span>
          <ArrowRight size={14} className={styles.routeArrow} />
          <span className={styles.routeDest}>{getBranchLabel(item.to_branch)}</span>
        </div>
      )
    },
    {
      key: 'room_transfer',
      label: 'Transfer Ruang',
      width: '20%',
      render: (item) => (
        <div className={styles.routeCell}>
          <span className={styles.routeSource}>{getRoomLabel(item.from_room)}</span>
          <ArrowRight size={14} className={styles.routeArrow} />
          <span className={styles.routeDest}>{getRoomLabel(item.to_room)}</span>
        </div>
      )
    },
    {
      key: 'new_pic',
      label: 'PIC Baru',
      width: '15%',
      render: (item) => getPicLabel(item.new_pic)
    },
    {
      key: 'transfer_date',
      label: 'Tanggal',
      width: '13%',
      render: (item) => new Date(item.transfer_date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }
  ];

  const userRole = session?.user?.role;
  const isBranchAdmin = userRole === ROLES.BRANCH_ADMIN;

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.header}>
        <div>
          <p className={styles.subtext}>Kelola dan catat pemindahan aset antar lokasi cabang atau ruang sekolah.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleOpenModal}
          icon={<Plus size={18} />}
        >
          Transfer Aset
        </Button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={columns}
          data={transfers}
          loading={loading}
          emptyMessage="Tidak ada riwayat transfer aset"
          emptyIcon={Truck}
        />
      </div>

      {/* Pagination */}
      {!loading && transfers.length > 0 && (
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
              disabled={transfers.length < limit}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Transfer Aset ke Lokasi Baru"
        size="sm"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formField}>
            <label htmlFor="transfer_asset_id">ID Aset*</label>
            <input 
              id="transfer_asset_id"
              type="text" 
              name="asset_id" 
              value={form.asset_id}
              onChange={handleInputChange}
              placeholder="Contoh: CBG01-LAPTOP-0001" 
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="transfer_to_branch">Cabang Tujuan*</label>
            <select 
              id="transfer_to_branch"
              name="to_branch" 
              value={form.to_branch}
              onChange={handleInputChange}
              required
            >
              <option value="">Pilih Cabang</option>
              {BRANCH_OPTIONS.map(opt => (
                <option 
                  key={opt.id} 
                  value={opt.id}
                  disabled={isBranchAdmin && opt.id !== session.user.branch_id}
                >
                  {opt.label} {isBranchAdmin && opt.id !== session.user.branch_id ? '(Terbatas Admin)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="transfer_to_room">Ruangan Tujuan*</label>
            <select 
              id="transfer_to_room"
              name="to_room" 
              value={form.to_room}
              onChange={handleInputChange}
              required
            >
              <option value="">Pilih Ruangan</option>
              {ROOM_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="transfer_new_pic">Penanggung Jawab (PIC) Baru*</label>
            <select 
              id="transfer_new_pic"
              name="new_pic" 
              value={form.new_pic}
              onChange={handleInputChange}
              required
            >
              <option value="">Pilih PIC</option>
              {PIC_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={submitting}
            >
              Simpan Pemindahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
