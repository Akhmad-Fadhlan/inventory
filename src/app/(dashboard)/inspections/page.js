'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { inspectionsApi } from '@/lib/api';
import { 
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
  ClipboardCheck, 
  Plus, 
  Search,
  Calendar,
  MessageSquare
} from 'lucide-react';
import styles from './page.module.css';

export default function InspectionsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    asset_id: '',
    result: ASSET_CONDITION.GOOD,
    notes: ''
  });

  const userRole = session?.user?.role;
  const isWritable = userRole === ROLES.SUPER_ADMIN || userRole === ROLES.BRANCH_ADMIN;

  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined
      };
      const res = await inspectionsApi.list(params);
      if (res.success) {
        setInspections(res.data || []);
      } else {
        showToast(res.message || 'Gagal memuat data inspeksi', 'error');
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
      fetchInspections();
    }
  }, [session, fetchInspections]);

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
    if (!form.asset_id || !form.result) {
      showToast('Mohon lengkapi field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await inspectionsApi.create(form);
      if (res.success) {
        showToast('Inspeksi aset berhasil dicatat!', 'success');
        setIsCreateModalOpen(false);
        fetchInspections();
      } else {
        showToast(res.message || 'Gagal mencatat inspeksi', 'error');
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
      result: ASSET_CONDITION.GOOD,
      notes: ''
    });
    setIsCreateModalOpen(true);
  };

  const columns = [
    {
      key: 'inspection_id',
      label: 'ID Inspeksi',
      width: '15%'
    },
    {
      key: 'asset_id',
      label: 'ID Aset',
      width: '20%'
    },
    {
      key: 'result',
      label: 'Hasil Pemeriksaan',
      width: '20%',
      render: (item) => (
        <Badge variant={STATUS_VARIANT[item.result] || 'default'}>
          {CONDITION_LABELS[item.result] || item.result}
        </Badge>
      )
    },
    {
      key: 'notes',
      label: 'Catatan Temuan',
      width: '30%',
      render: (item) => item.notes || 'Tidak ada catatan'
    },
    {
      key: 'inspection_date',
      label: 'Tanggal Inspeksi',
      width: '15%',
      render: (item) => new Date(item.inspection_date).toLocaleDateString('id-ID', {
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
          <p className={styles.subtext}>Sejarah audit kualitas fisik dan kepatuhan kelayakan aset sekolah.</p>
        </div>
        {isWritable && (
          <Button 
            variant="primary" 
            onClick={handleOpenCreateModal}
            icon={<Plus size={18} />}
          >
            Mulai Inspeksi
          </Button>
        )}
      </div>

      {/* Filter Card */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan ID Aset, ID Inspeksi, atau catatan..." 
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
          data={inspections}
          loading={loading}
          emptyMessage="Tidak ada riwayat inspeksi aset ditemukan"
          emptyIcon={ClipboardCheck}
        />
      </div>

      {/* Create Inspection Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Formulir Inspeksi Aset"
        size="sm"
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

          <div className={styles.formField}>
            <label htmlFor="result">Kondisi Hasil Pemeriksaan*</label>
            <select 
              id="result"
              name="result" 
              value={form.result}
              onChange={handleInputChange}
              required
            >
              <option value={ASSET_CONDITION.GOOD}>Baik (Layak Pakai)</option>
              <option value={ASSET_CONDITION.MINOR_DAMAGE}>Rusak Ringan (Butuh Servis/Perbaikan)</option>
              <option value={ASSET_CONDITION.MAJOR_DAMAGE}>Rusak Berat (Tidak Layak Pakai)</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="notes">Catatan Pemeriksaan</label>
            <textarea 
              id="notes"
              name="notes" 
              value={form.notes}
              onChange={handleInputChange}
              placeholder="Sebutkan temuan masalah secara spesifik (misal: layar berkedip, baterai drop, dll)..."
              rows={4}
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
              Simpan Hasil Audit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
