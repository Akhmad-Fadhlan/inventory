'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { assetsApi } from '@/lib/api';
import { 
  STATUS_LABELS, 
  CONDITION_LABELS, 
  STATUS_VARIANT, 
  ROLES,
  TRANSACTION_LABELS,
  ASSET_STATUS,
  ASSET_CONDITION
} from '@/lib/constants';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Providers';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  QrCode, 
  Camera, 
  Calendar,
  Building,
  User,
  MapPin,
  Tag,
  AlertTriangle,
  History,
  FileText
} from 'lucide-react';
import styles from './page.module.css';

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

export default function AssetDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [asset, setAsset] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Form state
  const [form, setForm] = useState({
    item_name: '',
    category_id: '',
    branch_id: '',
    room_id: '',
    pic_id: '',
    brand: '',
    serial_number: '',
    notes: '',
    condition: '',
    status: ''
  });

  const userRole = session?.user?.role;
  const isWritable = userRole === ROLES.SUPER_ADMIN || userRole === ROLES.BRANCH_ADMIN;

  const fetchAssetDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await assetsApi.get(id);
      if (res.success && res.data) {
        setAsset(res.data);
        setTransactions(res.data.transactions || []);
        
        // Populate edit form
        setForm({
          item_name: res.data.item_name || '',
          category_id: res.data.category_id || '',
          branch_id: res.data.branch_id || '',
          room_id: res.data.room_id || '',
          pic_id: res.data.pic_id || '',
          brand: res.data.brand || '',
          serial_number: res.data.serial_number || '',
          notes: res.data.notes || '',
          condition: res.data.condition || '',
          status: res.data.status || ''
        });
      } else {
        showToast(res.message || 'Gagal memuat detail aset', 'error');
        router.push('/assets');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
      router.push('/assets');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    if (session && id) {
      fetchAssetDetails();
    }
  }, [session, id, fetchAssetDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await assetsApi.update(id, form);
      if (res.success) {
        showToast('Aset berhasil diperbarui!', 'success');
        setIsEditModalOpen(false);
        fetchAssetDetails();
      } else {
        showToast(res.message || 'Gagal memperbarui aset', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      setActionLoading(true);
      const res = await assetsApi.delete(id);
      if (res.success) {
        showToast('Aset berhasil dihapus!', 'success');
        setIsDeleteModalOpen(false);
        router.push('/assets');
      } else {
        showToast(res.message || 'Gagal menghapus aset', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateQr = async () => {
    try {
      setActionLoading(true);
      const res = await assetsApi.generateQr(id);
      if (res.success && res.data) {
        showToast('QR Code berhasil diregenerasi!', 'success');
        fetchAssetDetails();
        setIsQrModalOpen(true);
      } else {
        showToast(res.message || 'Gagal membuat QR Code', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (limit to 1MB to avoid GAS payload limit)
    if (file.size > 1024 * 1024) {
      showToast('Ukuran file maksimal adalah 1MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setActionLoading(true);
        const base64Photo = reader.result.split(',')[1]; // Get raw base64 string
        const res = await assetsApi.uploadPhoto(id, base64Photo);
        if (res.success) {
          showToast('Foto aset berhasil diunggah!', 'success');
          fetchAssetDetails();
        } else {
          showToast(res.message || 'Gagal mengunggah foto', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Gagal mengunggah foto', 'error');
      } finally {
        setActionLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Transaction history columns
  const transactionColumns = [
    {
      key: 'transaction_id',
      label: 'ID Transaksi',
      width: '15%'
    },
    {
      key: 'type',
      label: 'Jenis Kegiatan',
      width: '18%',
      render: (item) => (
        <Badge variant={STATUS_VARIANT[item.type] || 'default'}>
          {TRANSACTION_LABELS[item.type] || item.type}
        </Badge>
      )
    },
    {
      key: 'operator_name',
      label: 'Operator',
      width: '20%'
    },
    {
      key: 'notes',
      label: 'Catatan / Deskripsi',
      width: '32%',
      render: (item) => item.notes || '-'
    },
    {
      key: 'created_at',
      label: 'Tanggal',
      width: '15%',
      render: (item) => new Date(item.created_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  ];

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!asset) return null;

  const branchLabel = BRANCH_OPTIONS.find(b => b.id === asset.branch_id)?.label || asset.branch_id;
  const roomLabel = ROOM_OPTIONS.find(r => r.id === asset.room_id)?.label || asset.room_id;
  const picLabel = PIC_OPTIONS.find(p => p.id === asset.pic_id)?.label || asset.pic_id;
  const categoryLabel = CATEGORY_OPTIONS.find(c => c.id === asset.category_id)?.label || asset.category_id;

  return (
    <div className={styles.container}>
      {/* Back button and page actions */}
      <div className={styles.actionHeader}>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/assets')}
          icon={<ArrowLeft size={16} />}
        >
          Kembali ke Daftar
        </Button>

        {isWritable && (
          <div className={styles.adminActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsEditModalOpen(true)}
              icon={<Edit size={16} />}
            >
              Edit Aset
            </Button>
            <Button 
              variant="danger" 
              onClick={() => setIsDeleteModalOpen(true)}
              icon={<Trash2 size={16} />}
            >
              Hapus Aset
            </Button>
          </div>
        )}
      </div>

      {/* Grid: Media + Info */}
      <div className={styles.mainGrid}>
        {/* Left Column: Photos and QR */}
        <div className={styles.mediaCard}>
          <div className={styles.imageSection}>
            {asset.photo_url ? (
              <img 
                src={asset.photo_url} 
                alt={asset.item_name} 
                className={styles.assetImage}
              />
            ) : (
              <div className={styles.placeholderImage}>
                <Camera size={48} className={styles.cameraIcon} />
                <span>Belum ada foto aset</span>
              </div>
            )}
            
            {isWritable && (
              <label className={styles.uploadBtn}>
                <Camera size={14} style={{ marginRight: '6px' }} />
                {asset.photo_url ? 'Ubah Foto' : 'Unggah Foto'}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  disabled={actionLoading}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          <div className={styles.qrSection}>
            <div className={styles.qrWrapper}>
              {asset.qr_code ? (
                <img 
                  src={asset.qr_code} 
                  alt="QR Code" 
                  className={styles.qrImage}
                  onClick={() => setIsQrModalOpen(true)}
                  title="Klik untuk memperbesar"
                />
              ) : (
                <div className={styles.placeholderQr}>
                  <QrCode size={40} />
                  <span>QR Code belum dibuat</span>
                </div>
              )}
            </div>
            {isWritable && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGenerateQr}
                loading={actionLoading}
                icon={<QrCode size={14} />}
              >
                Regenerasi QR
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Asset Specifications */}
        <div className={styles.infoCard}>
          <div className={styles.infoTitleSection}>
            <div className={styles.badgeRow}>
              <Badge variant={STATUS_VARIANT[asset.status] || 'default'}>
                {STATUS_LABELS[asset.status] || asset.status}
              </Badge>
              <Badge variant={STATUS_VARIANT[asset.condition] || 'default'}>
                {CONDITION_LABELS[asset.condition] || asset.condition}
              </Badge>
            </div>
            <h2 className={styles.assetName}>{asset.item_name}</h2>
            <span className={styles.assetCode}>ID Aset: {asset.asset_id}</span>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <Tag size={18} className={styles.detailIcon} />
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>Kategori</span>
                <span className={styles.detailValue}>{categoryLabel}</span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <Building size={18} className={styles.detailIcon} />
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>Cabang / Lokasi</span>
                <span className={styles.detailValue}>{branchLabel}</span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <MapPin size={18} className={styles.detailIcon} />
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>Ruangan</span>
                <span className={styles.detailValue}>{roomLabel}</span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <User size={18} className={styles.detailIcon} />
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>Penanggung Jawab (PIC)</span>
                <span className={styles.detailValue}>{picLabel}</span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <FileText size={18} className={styles.detailIcon} />
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>Merek / Brand</span>
                <span className={styles.detailValue}>{asset.brand || '—'}</span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <FileText size={18} className={styles.detailIcon} />
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>Nomor Seri</span>
                <span className={styles.detailValue}>{asset.serial_number || '—'}</span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <Calendar size={18} className={styles.detailIcon} />
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>Tanggal Registrasi</span>
                <span className={styles.detailValue}>
                  {new Date(asset.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.notesSection}>
            <span className={styles.notesLabel}>Catatan Tambahan</span>
            <p className={styles.notesValue}>
              {asset.notes || 'Tidak ada catatan tambahan untuk aset ini.'}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <History size={20} className={styles.historyIcon} />
          <h3>Riwayat Aktivitas Aset</h3>
        </div>
        <DataTable 
          columns={transactionColumns}
          data={transactions}
          loading={false}
          emptyMessage="Belum ada riwayat aktivitas untuk aset ini"
        />
      </div>

      {/* QR Code Zoom Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="QR Code Inventaris"
        size="sm"
      >
        <div className={styles.qrZoomContainer}>
          <img src={asset.qr_code} alt="QR Code Large" className={styles.qrZoomImage} />
          <strong className={styles.qrZoomText}>{asset.asset_id}</strong>
          <span className={styles.qrZoomSub}>{asset.item_name}</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.print()}
            style={{ marginTop: '16px' }}
          >
            Cetak Label QR
          </Button>
        </div>
      </Modal>

      {/* Edit Asset Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Detail Aset"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="item_name">Nama Barang*</label>
              <input 
                id="item_name"
                type="text" 
                name="item_name" 
                value={form.item_name}
                onChange={handleInputChange}
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
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="condition">Kondisi Aset*</label>
              <select 
                id="condition"
                name="condition" 
                value={form.condition}
                onChange={handleInputChange}
                required
              >
                <option value={ASSET_CONDITION.GOOD}>Baik</option>
                <option value={ASSET_CONDITION.MINOR_DAMAGE}>Kerusakan Ringan</option>
                <option value={ASSET_CONDITION.MAJOR_DAMAGE}>Kerusakan Berat</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="status">Status Aset*</label>
              <select 
                id="status"
                name="status" 
                value={form.status}
                onChange={handleInputChange}
                required
              >
                <option value={ASSET_STATUS.AVAILABLE}>Tersedia</option>
                <option value={ASSET_STATUS.BORROWED}>Dipinjam</option>
                <option value={ASSET_STATUS.MAINTENANCE}>Perbaikan</option>
                <option value={ASSET_STATUS.DAMAGED}>Rusak</option>
              </select>
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
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="notes">Catatan Tambahan</label>
            <textarea 
              id="notes"
              name="notes" 
              value={form.notes}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className={styles.formActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsEditModalOpen(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={actionLoading}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Aset"
        size="sm"
      >
        <div className={styles.deleteConfirmWrapper}>
          <AlertTriangle size={48} className={styles.warningIcon} />
          <h4>Apakah Anda yakin ingin menghapus aset ini?</h4>
          <p>
            Tindakan ini tidak dapat dibatalkan. Aset <strong>{asset.item_name}</strong> ({asset.asset_id}) akan dihapus secara soft-delete dari sistem.
          </p>
          <div className={styles.deleteActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteSubmit}
              loading={actionLoading}
            >
              Ya, Hapus Aset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
