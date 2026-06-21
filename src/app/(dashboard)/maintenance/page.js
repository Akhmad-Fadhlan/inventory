'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { maintenanceApi } from '@/lib/api';
import { 
  STATUS_LABELS, 
  STATUS_VARIANT, 
  ROLES 
} from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Providers';
import { 
  Plus, 
  SlidersHorizontal, 
  Wrench, 
  Edit3, 
  Calendar,
  Tool
} from 'lucide-react';
import styles from './page.module.css';

// Predefined issue types for easy testing
const ISSUE_TYPES = [
  { id: 'HARDWARE_FAULT', label: 'Kerusakan Perangkat Keras' },
  { id: 'SOFTWARE_ERROR', label: 'Masalah Perangkat Lunak' },
  { id: 'SCREEN_DAMAGE', label: 'Layar Pecah / Rusak' },
  { id: 'BATTERY_ISSUE', label: 'Baterai Kembung / Drop' },
  { id: 'RETURNED_DAMAGE', label: 'Kerusakan Pengembalian' },
  { id: 'LAINNYA', label: 'Lain-lain / Servis Rutin' },
];

export default function MaintenancePage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  
  // Selected ticket for update
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    asset_id: '',
    issue_type: '',
    description: '',
    technician: ''
  });

  const [updateForm, setUpdateForm] = useState({
    technician: '',
    status: '',
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (page - 1) * limit,
        status: statusFilter || undefined,
      };

      const res = await maintenanceApi.list(params);
      if (res.success) {
        setTickets(res.data || []);
      } else {
        showToast(res.message || 'Gagal memuat daftar perbaikan', 'error');
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
      fetchTickets();
    }
  }, [session, fetchTickets]);

  const handleOpenCreateModal = () => {
    setCreateForm({
      asset_id: '',
      issue_type: '',
      description: '',
      technician: ''
    });
    setIsCreateOpen(true);
  };

  const handleOpenUpdateModal = (ticket) => {
    setSelectedTicket(ticket);
    setUpdateForm({
      technician: ticket.technician || '',
      status: ticket.status || 'PENDING'
    });
    setIsUpdateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.asset_id || !createForm.issue_type || !createForm.description) {
      showToast('Mohon lengkapi semua field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmittingCreate(true);
      const res = await maintenanceApi.create(createForm);
      if (res.success) {
        showToast('Tiket perbaikan berhasil dibuat!', 'success');
        setIsCreateOpen(false);
        fetchTickets();
      } else {
        showToast(res.message || 'Gagal membuat tiket perbaikan', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingUpdate(true);
      const res = await maintenanceApi.update(selectedTicket.maintenance_id, updateForm);
      if (res.success) {
        showToast('Tiket perbaikan berhasil diperbarui!', 'success');
        setIsUpdateOpen(false);
        fetchTickets();
      } else {
        showToast(res.message || 'Gagal memperbarui tiket perbaikan', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const columns = [
    {
      key: 'maintenance_id',
      label: 'ID Tiket',
      width: '12%'
    },
    {
      key: 'asset_id',
      label: 'ID Aset',
      width: '15%'
    },
    {
      key: 'issue_type',
      label: 'Tipe Masalah',
      width: '18%',
      render: (item) => ISSUE_TYPES.find(i => i.id === item.issue_type)?.label || item.issue_type
    },
    {
      key: 'description',
      label: 'Deskripsi',
      width: '23%',
      render: (item) => <span className={styles.notesText}>{item.description}</span>
    },
    {
      key: 'technician',
      label: 'Teknisi',
      width: '13%',
      render: (item) => item.technician || 'Belum Ditugaskan'
    },
    {
      key: 'status',
      label: 'Status',
      width: '8%',
      render: (item) => (
        <Badge variant={STATUS_VARIANT[item.status] || 'default'}>
          {STATUS_LABELS[item.status] || item.status}
        </Badge>
      )
    },
    {
      key: 'start_date',
      label: 'Mulai',
      width: '11%',
      render: (item) => new Date(item.start_date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short'
      })
    },
    {
      key: 'action',
      label: 'Aksi',
      width: '8%',
      render: (item) => {
        if (item.status === 'COMPLETED') return '—';
        return (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleOpenUpdateModal(item)}
            icon={<Edit3 size={14} />}
          >
            Update
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
          <p className={styles.subtext}>Monitor dan kelola proses perbaikan/pemeliharaan aset sekolah.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleOpenCreateModal}
          icon={<Plus size={18} />}
        >
          Buat Tiket
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
            aria-label="Filter status tiket"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu (Pending)</option>
            <option value="COMPLETED">Selesai (Completed)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={columns}
          data={tickets}
          loading={loading}
          emptyMessage="Tidak ada tiket perbaikan terdaftar"
          emptyIcon={Wrench}
        />
      </div>

      {/* Pagination */}
      {!loading && tickets.length > 0 && (
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
              disabled={tickets.length < limit}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Tiket Perbaikan Baru"
        size="sm"
      >
        <form onSubmit={handleCreateSubmit} className={styles.form}>
          <div className={styles.formField}>
            <label htmlFor="create_asset_id">ID Aset*</label>
            <input 
              id="create_asset_id"
              type="text" 
              name="asset_id" 
              value={createForm.asset_id}
              onChange={(e) => setCreateForm(prev => ({ ...prev, asset_id: e.target.value }))}
              placeholder="Contoh: CBG01-LAPTOP-0001" 
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="create_issue_type">Tipe Kerusakan*</label>
            <select 
              id="create_issue_type"
              name="issue_type" 
              value={createForm.issue_type}
              onChange={(e) => setCreateForm(prev => ({ ...prev, issue_type: e.target.value }))}
              required
            >
              <option value="">Pilih Tipe Masalah</option>
              {ISSUE_TYPES.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="create_technician">Teknisi (Opsional)</label>
            <input 
              id="create_technician"
              type="text" 
              name="technician" 
              value={createForm.technician}
              onChange={(e) => setCreateForm(prev => ({ ...prev, technician: e.target.value }))}
              placeholder="Nama penanggung jawab perbaikan" 
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="create_description">Deskripsi Kerusakan*</label>
            <textarea 
              id="create_description"
              name="description" 
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Jelaskan detail kendala pada barang..."
              rows={3}
              required
            />
          </div>

          <div className={styles.formActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsCreateOpen(false)}
              disabled={submittingCreate}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={submittingCreate}
            >
              Mulai Perbaikan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Modal */}
      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title="Perbarui Status Perbaikan"
        size="sm"
      >
        <form onSubmit={handleUpdateSubmit} className={styles.form}>
          {selectedTicket && (
            <div className={styles.ticketDetails}>
              <p>ID Tiket: <strong>{selectedTicket.maintenance_id}</strong></p>
              <p>Aset: <strong>{selectedTicket.asset_id}</strong></p>
              <p className={styles.ticketDesc}>Kerusakan: {selectedTicket.description}</p>
            </div>
          )}

          <div className={styles.formField}>
            <label htmlFor="update_technician">Teknisi Ditugaskan</label>
            <input 
              id="update_technician"
              type="text" 
              name="technician" 
              value={updateForm.technician}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, technician: e.target.value }))}
              placeholder="Nama teknisi" 
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="update_status">Status Perbaikan*</label>
            <select 
              id="update_status"
              name="status" 
              value={updateForm.status}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
              required
            >
              <option value="PENDING">Menunggu (Pending)</option>
              <option value="COMPLETED">Selesai (Completed / Kembali Tersedia)</option>
            </select>
          </div>

          <div className={styles.formActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsUpdateOpen(false)}
              disabled={submittingUpdate}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={submittingUpdate}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
