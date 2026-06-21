'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  Upload, 
  FileText, 
  Calendar, 
  MapPin, 
  User as UserIcon,
  HelpCircle,
  Camera,
  History
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

export default function AssetDetailPage({ params }) {
  const { id } = params;
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Edit form state
  const [form, setForm] = useState({
    item_name: '',
    category_id: '',
    branch_id: '',
    room_id: '',
    pic_id: '',
    brand: '',
    serial_number: '',
    condition: '',
    status: '',
    notes: ''
  });

  const userRole = session?.user?.role;
  const isWritable = userRole === ROLES.SUPER_ADMIN || userRole === ROLES.BRANCH_ADMIN;

  const fetchAssetDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await assetsApi.get(id);
      if (res.success && res.data) {
        setAsset(res.data);
        setForm({
          item_name: res.data.item_name || '',
          category_id: res.data.category_id || '',
          branch_id: res.data.branch_id || '',
          room_id: res.data.room_id || '',
          pic_id: res.data.pic_id || '',
          brand: res.data.brand || '',
          serial_number: res.data.serial_number || '',
          condition: res.data.condition || '',
          status: res.data.status || '',
          notes: res.data.notes || ''
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
    if (session) {
      fetchAssetDetails();
    }
  }, [session, fetchAssetDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.category_id || !form.branch_id || !form.room_id || !form.pic_id) {
      showToast('Mohon lengkapi semua field wajib (*)', 'warning');
      return;
    }

    try {
      setSubmittingEdit(true);
      const res = await assetsApi.update(id, form);
      if (res.success) {
        showToast('Detail aset berhasil diperbarui', 'success');
        setIsEditOpen(false);
        fetchAssetDetails();
      } else {
        showToast(res.message || 'Gagal memperbarui aset', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      setSubmittingDelete(true);
      const res = await assetsApi.delete(id);
      if (res.success) {
        showToast('Aset berhasil dihapus', 'success');
        setIsDeleteOpen(false);
        router.push('/assets');
      } else {
        showToast(res.message || 'Gagal menghapus aset', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleGenerateQr = async () => {
    try {
      setGeneratingQr(true);
      const res = await assetsApi.generateQr(id);
      if (res.success) {
        showToast('QR Code berhasil diperbarui', 'success');
        fetchAssetDetails();
      } else {
        showToast(res.message || 'Gagal memperbarui QR Code', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memproses pembuatan QR Code', 'error');
    } finally {
      setGeneratingQr(false);
    }
  };

  const handlePhotoUpload = () => {
    fileInputRef.current.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file foto melebihi limit 5MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setUploadingPhoto(true);
        // Extract raw base64 string
        const base64Content = reader.result.split(',')[1];
        const res = await assetsApi.uploadPhoto(id, base64Content);
        if (res.success) {
          showToast('Foto aset berhasil diperbarui', 'success');
          fetchAssetDetails();
        } else {
          showToast(res.message || 'Gagal mengunggah foto', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Gagal memproses foto', 'error');
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading && !asset) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>Aset tidak ditemukan</div>
      </div>
    );
  }

  // Format details labels
  const branchLabel = BRANCH_OPTIONS.find(b => b.id === asset.branch_id)?.label || asset.branch_id;
  const roomLabel = ROOM_OPTIONS.find(r => r.id === asset.room_id)?.label || asset.room_id;
  const picLabel = PIC_OPTIONS.find(p => p.id === asset.pic_id)?.label || asset.pic_id;
  const categoryLabel = CATEGORY_OPTIONS.find(c => c.id === asset.category_id)?.label || asset.category_id;

  const trxColumns = [
    {
      key: 'trx_id',
      label: 'ID Transaksi',
      width: '15%',
      render: (item) => item.transaction_id || '-'
    },
    {
      key: 'trx_type',
      label: 'Jenis',
      width: '15%',
      render: (item) => (
        <Badge variant={STATUS_VARIANT[item.trx_type] || 'default'}>
          {TRANSACTION_LABELS[item.trx_type] || item.trx_type}
        </Badge>
      )
    },
    {
      key: 'description',
      label: 'Deskripsi Keadaan',
      width: '40%',
      render: (item) => <span className={styles.trxNotes}>{item.description || '-'}</span>
    },
    {
      key: 'created_by',
      label: 'Oleh',
      width: '15%',
      render: (item) => item.created_by || '-'
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

  return (
    <div className={styles.container}>
      {/* Back link */}
      <div className={styles.backWrapper}>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/assets')}
          icon={<ArrowLeft size={16} />}
        >
          Kembali ke Daftar Aset
        </Button>
      </div>

      {/* Detail Head */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>{asset.item_name}</h2>
          <div className={styles.badgesRow}>
            <Badge variant={STATUS_VARIANT[asset.status] || 'default'}>
              {STATUS_LABELS[asset.status] || asset.status}
            </Badge>
            <Badge variant={STATUS_VARIANT[asset.condition] || 'default'}>
              {CONDITION_LABELS[asset.condition] || asset.condition}
            </Badge>
            <span className={styles.assetIdTag}>{asset.asset_id}</span>
          </div>
        </div>

        {isWritable && (
          <div className={styles.actionsArea}>
            <Button 
              variant="ghost"
              onClick={handleGenerateQr}
              loading={generatingQr}
              icon={<QrCode size={16} />}
            >
              Cetak QR
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setIsEditOpen(true)}
              icon={<Edit size={16} />}
            >
              Ubah
            </Button>
            <Button 
              variant="danger"
              onClick={() => setIsDeleteOpen(true)}
              icon={<Trash2 size={16} />}
            >
              Hapus
            </Button>
          </div>
        )}
      </div>

      {/* Main Grid: Info + Media */}
      <div className={styles.mainGrid}>
        {/* Left Side: General details card */}
        <div className={styles.detailsCard}>
          <h3 className={styles.sectionTitle}>
            <FileText size={18} className={styles.sectionTitleIcon} />
            Informasi Detail Aset
          </h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Nama Barang</span>
              <span className={styles.detailValue}>{asset.item_name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Kategori</span>
              <span className={styles.detailValue}>{categoryLabel}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Merek</span>
              <span className={styles.detailValue}>{asset.brand || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Nomor Seri</span>
              <span className={styles.detailValue}>{asset.serial_number || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Cabang</span>
              <span className={styles.detailValue}>
                <MapPin size={14} className={styles.inlineIcon} /> {branchLabel}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Ruangan</span>
              <span className={styles.detailValue}>{roomLabel}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Penanggung Jawab (PIC)</span>
              <span className={styles.detailValue}>
                <UserIcon size={14} className={styles.inlineIcon} /> {picLabel}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Tanggal Registrasi</span>
              <span className={styles.detailValue}>
                <Calendar size={14} className={styles.inlineIcon} />{' '}
                {new Date(asset.created_at).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          {asset.notes && (
            <div className={styles.notesBox}>
              <span className={styles.detailLabel}>Catatan Tambahan</span>
              <p className={styles.notesContent}>{asset.notes}</p>
            </div>
          )}
        </div>

        {/* Right Side: Media (Photo & QR Code) */}
        <div className={styles.mediaSide}>
          {/* Photo Card */}
          <div className={styles.mediaCard}>
            <div className={styles.photoHeader}>
              <h4>Foto Aset</h4>
              {isWritable && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handlePhotoUpload}
                    loading={uploadingPhoto}
                    icon={<Camera size={14} />}
                  >
                    Unggah
                  </Button>
                </>
              )}
            </div>
            <div className={styles.photoContainer}>
              {asset.photo_url ? (
                <img 
                  src={asset.photo_url} 
                  alt={asset.item_name} 
                  className={styles.assetImg}
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <Camera size={48} className={styles.photoPlaceholderIcon} />
                  <span>Belum ada foto aset</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Card */}
          <div className={styles.mediaCard}>
            <h4>Barcode / QR Code</h4>
            <div className={styles.qrContainer}>
              {asset.qr_code ? (
                <div className={styles.qrImageWrapper}>
                  <img 
                    src={asset.qr_code} 
                    alt={`QR Code ${asset.asset_id}`}
                    className={styles.qrImg}
                  />
                  <span className={styles.qrId}>{asset.asset_id}</span>
                </div>
              ) : (
                <div className={styles.qrPlaceholder}>
                  <QrCode size={48} className={styles.qrPlaceholderIcon} />
                  <span>QR Code belum dibuat</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className={styles.transactionsSection}>
        <div className={styles.sectionHeader}>
          <History size={20} className={styles.sectionHeaderIcon} />
          <h3>Riwayat Log Transaksi Aset</h3>
        </div>
        <DataTable
          columns={trxColumns}
          data={asset.transactions || []}
          loading={loading}
          emptyMessage="Aset ini belum memiliki log aktivitas peminjaman, perbaikan, atau transfer."
        />
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Ubah Detail Aset"
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
              />
            </div>
          </div>

          <div className={styles.formRow}>
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
              <label htmlFor="condition">Kondisi Aset</label>
              <select 
                id="condition"
                name="condition" 
                value={form.condition}
                onChange={handleInputChange}
              >
                <option value={ASSET_CONDITION.GOOD}>Baik</option>
                <option value={ASSET_CONDITION.MINOR_DAMAGE}>Kerusakan Ringan</option>
                <option value={ASSET_CONDITION.MAJOR_DAMAGE}>Kerusakan Berat</option>
              </select>
            </div>
          </div>

          <div className={styles.formField}>
            <label htmlFor="status">Status Aset</label>
            <select 
              id="status"
              name="status" 
              value={form.status}
              onChange={handleInputChange}
            >
              <option value={ASSET_STATUS.AVAILABLE}>Tersedia</option>
              <option value={ASSET_STATUS.BORROWED}>Dipinjam</option>
              <option value={ASSET_STATUS.MAINTENANCE}>Perbaikan</option>
              <option value={ASSET_STATUS.DAMAGED}>Rusak</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="notes">Catatan</label>
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
              onClick={() => setIsEditOpen(false)}
              disabled={submittingEdit}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              variant="primary"
              loading={submittingEdit}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Aset"
        size="sm"
      >
        <div className={styles.deleteConfirmBody}>
          <HelpCircle size={40} className={styles.deleteConfirmIcon} />
          <p className={styles.deleteText}>Apakah Anda yakin ingin menghapus aset <strong>{asset.item_name}</strong> ({asset.asset_id})?</p>
          <p className={styles.deleteWarn}>Tindakan ini akan mengubah status aset menjadi terhapus dan mengeluarkannya dari inventaris aktif.</p>
          
          <div className={styles.deleteActions}>
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteOpen(false)}
              disabled={submittingDelete}
            >
              Batal
            </Button>
            <Button 
              variant="danger"
              onClick={handleDeleteSubmit}
              loading={submittingDelete}
            >
              Ya, Hapus Aset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
