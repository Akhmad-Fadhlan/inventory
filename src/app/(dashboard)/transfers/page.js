'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { transfersApi } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Providers';
import { 
  Truck, 
  Plus, 
  Search,
  ArrowRight,
  Calendar,
  Building,
  User
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
  const [searchVal, setSearchVal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    asset_id: '',
    to_branch: '',
    to_room: '',
    new_pic: ''
  });

  const userRole = session?.user?.role;
  const isWritable = userRole === ROLES.SUPER_ADMIN || userRole === ROLES.BRANCH_ADMIN;

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined
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
  }, [searchTerm, showToast]);

  useEffect(() => {
    if (session) {
      fetchTransfers();
    }
  }, [session, fetchTransfers]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_id || !form.to_branch || !form.to_room || !form.new_pic) {
      showToast('Mohon lengkapi field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await transfersApi.create(form);
      if (res.success) {
        showToast('Transfer aset berhasil diproses!', 'success');
        setIsCreateModalOpen(false);
        fetchTransfers();
      } else {
        showToast(res.message || 'Gagal memproses transfer aset', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    setForm({
      asset_id: '',
      to_branch: '',
      to_room: '',
      new_pic: ''
    });
    setIsCreateModalOpen(true);
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
      key: 'branch',
      label: 'Mutasi Cabang',
      width: '23%',
      render: (item) => (
        <div className={styles.routeCell}>
          <span className={styles.originLoc}>{getBranchLabel(item.from_branch)}</span>
          <ArrowRight size={14} className={styles.routeArrow} />
          <span className={styles.targetLoc}>{getBranchLabel(item.to_branch)}</span>
        </div>
      )
    },
    {
      key: 'room',
      label: 'Mutasi Ruang',
      width: '23%',
      render: (item) => (
        <div className={styles.routeCell}>
          <span className={styles.originLoc}>{getRoomLabel(item.from_room)}</span>
          <ArrowRight size={14} className={styles.routeArrow} />
          <span className={styles.targetLoc}>{getRoomLabel(item.to_room)}</span>
        </div>
      )
    },
    {
      key: 'new_pic',
      label: 'PIC Baru',
      width: '12%',
      render: (item) => getPicLabel(item.new_pic)
    },
    {
      key: 'transfer_date',
      label: 'Tanggal Mutasi',
      width: '15%',
      render: (item) => new Date(item.transfer_date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  ];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.subtext}>Mutasi pemindahan lokasi barang inventaris antar cabang, ruangan, maupun penanggung jawab.</p>
        </div>
        {isWritable && (
          <Button 
            variant="primary" 
            onClick={handleOpenCreateModal}
            icon={<Plus size={18} />}
          >
            Transfer Aset
          </Button>
        )}
      </div>

      {/* Filter Card */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan ID Aset, ID Transfer, cabang, atau PIC..." 
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={columns}
          data={transfers}
          loading={loading}
          emptyMessage="Tidak ada riwayat transfer aset ditemukan"
          emptyIcon={Truck}
        />
      </div>

      {/* Create Transfer Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Formulir Mutasi / Transfer Aset"
        size="md"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formField}>
            <label htmlFor="asset_id">ID Aset / Kode Barang*</label>
            <input 
              id="asset_id"
              type="text" 
              name="asset_id" 
              value={form.asset_id}
              onChange={handleInputChange}
              placeholder="Contoh: CBG01-LAPTOP-0001" 
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="to_branch">Cabang Tujuan*</label>
              <select 
                id="to_branch"
                name="to_branch" 
                value={form.to_branch}
                onChange={handleInputChange}
                required
              >
                <option value="">Pilih Cabang</option>
                {BRANCH_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="to_room">Ruangan Tujuan*</label>
              <select 
                id="to_room"
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
          </div>

          <div className={styles.formField}>
            <label htmlFor="new_pic">Penanggung Jawab (PIC) Baru*</label>
            <select 
              id="new_pic"
              name="new_pic" 
              value={form.new_pic}
              onChange={handleInputChange}
              required
            >
              <option value="">Pilih PIC Baru</option>
              {PIC_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={submitting}
            >
              Proses Mutasi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
