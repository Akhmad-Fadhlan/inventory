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
  Plus, 
  ClipboardCheck, 
  SlidersHorizontal,
  Calendar,
  AlertCircle
} from 'lucide-react';
import styles from './page.module.css';

export default function InspectionsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    asset_id: '',
    result: ASSET_CONDITION.GOOD,
    notes: ''
  });

  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (page - 1) * limit
      };

      const res = await inspectionsApi.list(params);
      if (res.success) {
        setInspections(res.data || []);
      } else {
        showToast(res.message || 'Gagal memuat riwayat inspeksi', 'error');
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
      fetchInspections();
    }
  }, [session, fetchInspections]);

  const handleOpenModal = () => {
    setForm({
      asset_id: '',
      result: ASSET_CONDITION.GOOD,
      notes: ''
    });
    setIsOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_id || !form.result) {
      showToast('Mohon isi field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await inspectionsApi.create(form);
      if (res.success) {
        showToast('Inspeksi fisik berhasil dicatat!', 'success');
        setIsOpen(false);
        fetchInspections();
      } else {
        showToast(res.message || 'Gagal menyimpan inspeksi', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmitting(false);
    }
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
      key: 'inspection_date',
      label: 'Tanggal Inspeksi',
      width: '20%',
      render: (item) => new Date(item.inspection_date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      key: 'result',
      label: 'Kondisi Hasil',
      width: '20%',
      render: (item) => (
        <Badge variant={STATUS_VARIANT[item.result] || 'default'}>
          {CONDITION_LABELS[item.result] || item.result}
        </Badge>
      )
    },
    {
      key: 'notes',
      label: 'Catatan Keadaan',
      width: '25%',
      render: (item) => <span className={styles.notesText}>{item.notes || '—'}</span>
    }
  ];

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.header}>
        <div>
          <p className={styles.subtext}>Catatan riwayat pemeriksaan fisik berkala dan audit kondisi aset sekolah.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleOpenModal}
          icon={<Plus size={18} />}
        >
          Buat Inspeksi
        </Button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={columns}
          data={inspections}
          loading={loading}
          emptyMessage="Belum ada riwayat inspeksi aset"
          emptyIcon={ClipboardCheck}
        />
      </div>

      {/* Pagination */}
      {!loading && inspections.length > 0 && (
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
              disabled={inspections.length < limit}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Catat Inspeksi Fisik Aset"
        size="sm"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formField}>
            <label htmlFor="inspect_asset_id">ID Aset*</label>
            <input 
              id="inspect_asset_id"
              type="text" 
              name="asset_id" 
              value={form.asset_id}
              onChange={handleInputChange}
              placeholder="Contoh: CBG01-LAPTOP-0001" 
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="inspect_result">Kondisi Hasil Pemeriksaan*</label>
            <select 
              id="inspect_result"
              name="result" 
              value={form.result}
              onChange={handleInputChange}
              required
            >
              <option value={ASSET_CONDITION.GOOD}>Baik (Siap Digunakan)</option>
              <option value={ASSET_CONDITION.MINOR_DAMAGE}>Kerusakan Ringan (Akan Masuk Perbaikan)</option>
              <option value={ASSET_CONDITION.MAJOR_DAMAGE}>Kerusakan Berat (Rusak Total)</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="inspect_notes">Catatan Pemeriksaan</label>
            <textarea 
              id="inspect_notes"
              name="notes" 
              value={form.notes}
              onChange={handleInputChange}
              placeholder="Tuliskan keterangan detail kondisi fisik barang..."
              rows={3}
            />
          </div>

          <div className={styles.warningAlert}>
            <AlertCircle size={16} className={styles.alertIcon} />
            <p className={styles.alertText}>
              Memilih <strong>Kerusakan Ringan</strong> akan secara otomatis memindahkan status aset ke perbaikan dan membuat tiket perbaikan pending.
            </p>
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
              Simpan Hasil
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
