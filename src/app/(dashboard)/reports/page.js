'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { reportsApi } from '@/lib/api';
import { 
  STATUS_LABELS, 
  CONDITION_LABELS, 
  STATUS_VARIANT 
} from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { useToast } from '@/components/Providers';
import { 
  FileBarChart, 
  Printer, 
  Download,
  Calendar,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import styles from './page.module.css';

const TABS = [
  { id: 'assets', label: 'Laporan Aset' },
  { id: 'borrowings', label: 'Laporan Peminjaman' },
  { id: 'maintenances', label: 'Laporan Perbaikan' },
  { id: 'opname', label: 'Laporan Opname' },
];

export default function ReportsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('assets');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status = statusFilter;

      switch (activeTab) {
        case 'assets':
          res = await reportsApi.assets(params);
          break;
        case 'borrowings':
          res = await reportsApi.borrowings(params);
          break;
        case 'maintenances':
          res = await reportsApi.maintenances(params);
          break;
        case 'opname':
          res = await reportsApi.opname(params);
          break;
        default:
          return;
      }

      if (res && res.success) {
        setData(res.data || []);
      } else {
        showToast(res?.message || 'Gagal memuat data laporan', 'error');
        setData([]);
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, statusFilter, showToast]);

  useEffect(() => {
    if (session) {
      fetchReportData();
    }
  }, [session, fetchReportData]);

  // Reset filters when changing tabs
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setData([]);
  };

  const handlePrint = () => {
    window.print();
  };

  // Define columns dynamically depending on the active tab
  const getColumns = () => {
    switch (activeTab) {
      case 'assets':
        return [
          { key: 'asset_id', label: 'ID Aset' },
          { key: 'item_name', label: 'Nama Aset' },
          { key: 'category', label: 'Kategori' },
          { key: 'brand', label: 'Merek' },
          { key: 'serial_number', label: 'No. Seri' },
          { key: 'branch', label: 'Cabang' },
          { key: 'room', label: 'Ruangan' },
          { key: 'pic', label: 'PIC' },
          { 
            key: 'condition', 
            label: 'Kondisi',
            render: (item) => (
              <Badge variant={STATUS_VARIANT[item.condition] || 'default'}>
                {CONDITION_LABELS[item.condition] || item.condition}
              </Badge>
            )
          },
          { 
            key: 'status', 
            label: 'Status',
            render: (item) => (
              <Badge variant={STATUS_VARIANT[item.status] || 'default'}>
                {STATUS_LABELS[item.status] || item.status}
              </Badge>
            )
          }
        ];
      case 'borrowings':
        return [
          { key: 'borrow_id', label: 'ID Pinjam' },
          { key: 'asset_id', label: 'ID Aset' },
          { key: 'item_name', label: 'Nama Barang' },
          { key: 'borrower_name', label: 'Peminjam' },
          { key: 'borrower_position', label: 'Jabatan' },
          { 
            key: 'borrow_date', 
            label: 'Tgl Pinjam',
            render: (item) => new Date(item.borrow_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          },
          { 
            key: 'planned_return_date', 
            label: 'Rencana Kembali',
            render: (item) => item.planned_return_date ? new Date(item.planned_return_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
          },
          { 
            key: 'actual_return_date', 
            label: 'Tgl Kembali',
            render: (item) => item.actual_return_date ? new Date(item.actual_return_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
          },
          { 
            key: 'status', 
            label: 'Status',
            render: (item) => (
              <Badge variant={item.status === 'RETURNED' ? 'success' : 'info'}>
                {item.status === 'RETURNED' ? 'Kembali' : 'Dipinjam'}
              </Badge>
            )
          }
        ];
      case 'maintenances':
        return [
          { key: 'maintenance_id', label: 'ID Tiket' },
          { key: 'asset_id', label: 'ID Aset' },
          { key: 'item_name', label: 'Nama Barang' },
          { key: 'issue_type', label: 'Kerusakan' },
          { key: 'description', label: 'Deskripsi Masalah' },
          { key: 'technician', label: 'Teknisi' },
          { 
            key: 'status', 
            label: 'Status',
            render: (item) => (
              <Badge variant={STATUS_VARIANT[item.status] || 'default'}>
                {STATUS_LABELS[item.status] || item.status}
              </Badge>
            )
          },
          { 
            key: 'start_date', 
            label: 'Mulai',
            render: (item) => new Date(item.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          },
          { 
            key: 'finish_date', 
            label: 'Selesai',
            render: (item) => item.finish_date ? new Date(item.finish_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
          }
        ];
      case 'opname':
        return [
          { key: 'asset_id', label: 'ID Aset' },
          { key: 'item_name', label: 'Nama Barang' },
          { key: 'category', label: 'Kategori' },
          { key: 'branch', label: 'Cabang' },
          { key: 'room', label: 'Ruangan' },
          { 
            key: 'condition', 
            label: 'Kondisi',
            render: (item) => (
              <Badge variant={STATUS_VARIANT[item.condition] || 'default'}>
                {CONDITION_LABELS[item.condition] || item.condition}
              </Badge>
            )
          },
          { 
            key: 'last_inspected_at', 
            label: 'Terakhir Diperiksa',
            render: (item) => item.last_inspected_at ? new Date(item.last_inspected_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Belum Pernah'
          },
          { 
            key: 'days_since_inspection', 
            label: 'Selisih Hari',
            render: (item) => item.days_since_inspection !== null ? `${item.days_since_inspection} Hari` : '—'
          },
          { 
            key: 'opname_status', 
            label: 'Status Opname',
            render: (item) => {
              if (item.opname_status === 'VERIFIED') {
                return <Badge variant="success">Terverifikasi</Badge>;
              } else if (item.opname_status === 'OVERDUE') {
                return <Badge variant="danger">Terlambat</Badge>;
              } else {
                return <Badge variant="warning">Menunggu Inspeksi</Badge>;
              }
            }
          }
        ];
      default:
        return [];
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={`${styles.pageHeader} no-print`}>
        <div>
          <p className={styles.subtext}>Ekspor dan cetak laporan inventaris, log peminjaman, pemeliharaan, serta audit opname.</p>
        </div>
        <div className={styles.actions}>
          <Button 
            variant="primary" 
            onClick={handlePrint}
            icon={<Printer size={18} />}
            className={styles.printBtn}
          >
            Cetak Laporan
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className={`${styles.tabBar} no-print`}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters (Render conditionally depending on tab type) */}
      <div className={`${styles.filterRow} no-print`}>
        <div className={styles.filterGroup}>
          <SlidersHorizontal size={16} className={styles.filterIcon} />
          
          {/* Date range inputs for borrowings or repairs */}
          {(activeTab === 'borrowings' || activeTab === 'maintenances') && (
            <div className={styles.dateInputs}>
              <div className={styles.inputWrapper}>
                <Calendar size={14} className={styles.inputIcon} />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.dateInput}
                  title="Tanggal Mulai"
                  aria-label="Tanggal mulai laporan"
                />
              </div>
              <span className={styles.dateSpan}>s/d</span>
              <div className={styles.inputWrapper}>
                <Calendar size={14} className={styles.inputIcon} />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.dateInput}
                  title="Tanggal Selesai"
                  aria-label="Tanggal selesai laporan"
                />
              </div>
            </div>
          )}

          {/* Status selector for general reports */}
          {activeTab === 'assets' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.selectInput}
              aria-label="Filter status laporan"
            >
              <option value="">Semua Status</option>
              <option value="AVAILABLE">Tersedia</option>
              <option value="BORROWED">Dipinjam</option>
              <option value="MAINTENANCE">Perbaikan</option>
              <option value="DAMAGED">Rusak</option>
            </select>
          )}

          {activeTab === 'borrowings' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.selectInput}
              aria-label="Filter status peminjaman"
            >
              <option value="">Semua Status</option>
              <option value="BORROWED">Sedang Dipinjam</option>
              <option value="RETURNED">Sudah Dikembalikan</option>
            </select>
          )}

          {activeTab === 'maintenances' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.selectInput}
              aria-label="Filter status perbaikan"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu (Pending)</option>
              <option value="COMPLETED">Selesai (Completed)</option>
            </select>
          )}

          {activeTab === 'opname' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.selectInput}
              aria-label="Filter status audit opname"
            >
              <option value="">Semua Hasil Audit</option>
              <option value="VERIFIED">Terverifikasi (&lt; 6 Bulan)</option>
              <option value="OVERDUE">Terlambat (&gt; 6 Bulan)</option>
              <option value="PENDING_INSPECTION">Menunggu Inspeksi Awal</option>
            </select>
          )}
        </div>
      </div>

      {/* Print-only Header (Hidden on screen) */}
      <div className={styles.printHeader}>
        <h2>LAPORAN SISTEM INVENTARIS MANAJEMEN ASET SEKOLAH (SISMA)</h2>
        <p>Tipe Laporan: {TABS.find(t => t.id === activeTab)?.label}</p>
        <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        {startDate && endDate && <p>Periode: {startDate} s/d {endDate}</p>}
        <div className={styles.printDivider} />
      </div>

      {/* Table view */}
      <div className={styles.content}>
        <DataTable
          columns={getColumns()}
          data={data}
          loading={loading}
          emptyMessage="Tidak ada data laporan ditemukan untuk kriteria pencarian ini"
          emptyIcon={FileBarChart}
        />
      </div>

      {/* Print-only Footer */}
      <div className={styles.printFooter}>
        <div className={styles.signatureBlock}>
          <p>Disetujui oleh,</p>
          <div className={styles.signatureSpace} />
          <p>___________________</p>
          <p>Kepala Penanggung Jawab Inventaris</p>
        </div>
      </div>
    </div>
  );
}
