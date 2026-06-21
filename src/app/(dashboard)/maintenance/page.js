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
  Wrench, 
  Plus, 
  Edit, 
  CheckCircle2, 
  User,
  SlidersHorizontal,
  Search
} from 'lucide-react';
import styles from './page.module.css';

const ISSUE_TYPE_OPTIONS = [
  { id: 'HARDWARE_FAULT', label: 'Kerusakan Hardware' },
  { id: 'SOFTWARE_ISSUE', label: 'Masalah Software' },
  { id: 'ROUTINE_SERVICE', label: 'Servis Rutin / Kalibrasi' },
  { id: 'RETURNED_DAMAGE', label: 'Kerusakan Pasca Pinjam' },
  { id: 'OTHER', label: 'Lain-lain' },
];

export default function MaintenancePage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    asset_id: '',
    issue_type: '',
    description: '',
    technician: ''
  });

  const [updateForm, setUpdateForm] = useState({
    status: 'COMPLETED',
    technician: '',
    completion_notes: ''
  });

  const [selectedTicket, setSelectedTicket] = useState(null);

  const userRole = session?.user?.role;
  const isWritable = userRole === ROLES.SUPER_ADMIN || userRole === ROLES.BRANCH_ADMIN;

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter || undefined,
        search: searchTerm || undefined
      };
      const res = await maintenanceApi.list(params);
      if (res.success) {
        setTickets(res.data || []);
      } else {
        showToast(res.message || 'Gagal memuat data perbaikan', 'error');
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
      fetchTickets();
    }
  }, [session, fetchTickets]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.asset_id || !createForm.issue_type || !createForm.description) {
      showToast('Mohon lengkapi field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await maintenanceApi.create(createForm);
      if (res.success) {
        showToast('Tiket perbaikan berhasil dibuat!', 'success');
        setIsCreateModalOpen(false);
        fetchTickets();
      } else {
        showToast(res.message || 'Gagal membuat tiket perbaikan', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUpdateModal = (ticket) => {
    setSelectedTicket(ticket);
    setUpdateForm({
      status: ticket.status || 'COMPLETED',
      technician: ticket.technician || '',
      completion_notes: ticket.completion_notes || ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await maintenanceApi.update(selectedTicket.ticket_id, updateForm);
      if (res.success) {
        showToast('Status perbaikan berhasil diperbarui!', 'success');
        setIsUpdateModalOpen(false);
        fetchTickets();
      } else {
        showToast(res.message || 'Gagal memperbarui status perbaikan', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmitting(false);
    }
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
      key: 'ticket_id',
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
      label: 'Jenis Masalah',
      width: '18%',
      render: (item) => ISSUE_TYPE_OPTIONS.find(i => i.id === item.issue_type)?.label || item.issue_type
    },
    {
      key: 'description',
      label: 'Kerusakan',
      width: '22%',
      render: (item) => <span className={styles.descriptionText} title={item.description}>{item.description}</span>
    },
    {
      key: 'technician',
      label: 'Teknisi',
      width: '13%',
      render: (item) => item.technician || 'Belum Ditunjuk'
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
      width: '10%',
      render: (item) => {
        if (item.status === 'PENDING' && isWritable) {
          return (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleOpenUpdateModal(item)}
              icon={<Edit size={12} />}
            >
              Update
            </Button>
          );
        }
        return <span className={styles.completionText}>Selesai: {formatDate(item.end_date)}</span>;
      }
    }
  ];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.subtext}>Kelola tiket perbaikan, pemeliharaan berkala, dan koordinasi dengan teknisi.</p>
        </div>
        {isWritable && (
          <Button 
            variant="primary" 
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus size={18} />}
          >
            Buat Tiket Baru
          </Button>
        )}
      </div>

      {/* Filter Card */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan ID Aset, ID Tiket, teknisi, atau deskripsi..." 
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
            aria-label="Filter status perbaikan"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Sedang Diperbaiki (Pending)</option>
            <option value="COMPLETED">Selesai Diperbaiki (Completed)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={columns}
          data={tickets}
          loading={loading}
          emptyMessage="Tidak ada tiket perbaikan ditemukan"
          emptyIcon={Wrench}
        />
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Tiket Perbaikan Baru"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="asset_id">ID Aset*</label>
              <input 
                id="asset_id"
                type="text" 
                name="asset_id" 
                value={createForm.asset_id}
                onChange={handleCreateInputChange}
                placeholder="Contoh: CBG01-LAPTOP-0001" 
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="issue_type">Jenis Masalah*</label>
              <select 
                id="issue_type"
                name="issue_type" 
                value={createForm.issue_type}
                onChange={handleCreateInputChange}
                required
              >
                <option value="">Pilih Jenis Masalah</option>
                {ISSUE_TYPE_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formField}>
            <label htmlFor="technician">Teknisi (Opsional)</label>
            <input 
              id="technician"
              type="text" 
              name="technician" 
              value={createForm.technician}
              onChange={handleCreateInputChange}
              placeholder="Contoh: CV. Mandiri Computindo" 
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="description">Deskripsi Kerusakan / Kendala*</label>
            <textarea 
              id="description"
              name="description" 
              value={createForm.description}
              onChange={handleCreateInputChange}
              placeholder="Jelaskan kendala fisik atau software yang dialami oleh barang tersebut..."
              rows={4}
              required
            />
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
              Buat Tiket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Ticket Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Perbarui Status Perbaikan"
        size="sm"
      >
        {selectedTicket && (
          <form onSubmit={handleUpdateSubmit} className={styles.form}>
            <div className={styles.ticketBrief}>
              <p>Perbarui tiket untuk aset:</p>
              <strong>{selectedTicket.asset_id}</strong>
              <span className={styles.issueBrief}>
                Kendala: {ISSUE_TYPE_OPTIONS.find(i => i.id === selectedTicket.issue_type)?.label || selectedTicket.issue_type}
              </span>
            </div>

            <div className={styles.formField}>
              <label htmlFor="technician">Teknisi / Penanggung Jawab*</label>
              <input 
                id="technician"
                type="text" 
                value={updateForm.technician}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, technician: e.target.value }))}
                placeholder="Nama teknisi / CV servis"
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="status">Status Perbaikan*</label>
              <select 
                id="status"
                value={updateForm.status}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                required
              >
                <option value="PENDING">Sedang Diperbaiki (Pending)</option>
                <option value="COMPLETED">Selesai & Siap Digunakan (Completed)</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="completion_notes">Catatan Hasil Servis</label>
              <textarea 
                id="completion_notes"
                value={updateForm.completion_notes}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, completion_notes: e.target.value }))}
                placeholder="Contoh: Penggantian SSD berhasil, sistem terinstal ulang."
                rows={3}
              />
            </div>

            <div className={styles.formActions}>
              <Button 
                variant="ghost" 
                onClick={() => setIsUpdateModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                variant="primary"
                loading={submitting}
              >
                Simpan Status
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
