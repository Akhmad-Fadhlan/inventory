'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { reportsApi } from '@/lib/api';
import { 
  CONDITION_LABELS, 
  STATUS_LABELS, 
  STATUS_VARIANT 
} from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { useToast } from '@/components/Providers';
import { 
  FileBarChart, 
  Printer, 
  Database, 
  ArrowLeftRight, 
  Wrench, 
  CheckSquare
} from 'lucide-react';
import styles from './page.module.css';

const TABS = {
  ASSETS: 'ASSETS',
  BORROWINGS: 'BORROWINGS',
  MAINTENANCES: 'MAINTENANCES',
  OPNAME: 'OPNAME'
};

const CATEGORY_MAP = {
  LAPTOP: 'Laptop',
  PROYEKTOR: 'Proyektor',
  KURSI: 'Kursi',
  MEJA: 'Meja',
  AC: 'AC',
  LAINNYA: 'Lain-lain'
};

const BRANCH_MAP = {
  CBG01: 'Cabang Utama',
  CBG02: 'Cabang Pembantu',
  CBG03: 'Cabang Khusus'
};

const ROOM_MAP = {
  RUANG_KELAS_1: 'Ruang Kelas 1',
  LAB_KOMPUTER: 'Lab Komputer',
  RUANG_GURU: 'Ruang Guru',
  AULA: 'Aula'
};

export default function ReportsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(TABS.ASSETS);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setData([]);
      
      let res;
      switch (activeTab) {
        case TABS.ASSETS:
          res = await reportsApi.assets();
          break;
        case TABS.BORROWINGS:
          res = await reportsApi.borrowings();
          break;
        case TABS.MAINTENANCES:
          res = await reportsApi.maintenances();
          break;
        case TABS.OPNAME:
          res = await reportsApi.opname();
          break;
        default:
          return;
      }

      if (res.success) {
        setData(res.data || []);
      } else {
        showToast(res.message || 'Gagal memuat data laporan', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, showToast]);

  useEffect(() => {
    if (session) {
      fetchReportData();
    }
  }, [session, fetchReportData]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Define columns dynamically depending on selected tab
  const getColumns = () => {
    switch (activeTab) {
      case TABS.ASSETS:
        return [
          { key: 'asset_id', label: 'ID Aset', width: '15%' },
          { key: 'item_name', label: 'Nama Aset', width: '22%' },
          { 
            key: 'category_id', 
            label: 'Kategori', 
            width: '12%',
            render: (item) => CATEGORY_MAP[item.category_id] || item.category_id 
          },
          { 
            key: 'branch_id', 
            label: 'Cabang', 
            width: '15%',
            render: (item) => BRANCH_MAP[item.branch_id] || item.branch_id 
          },
          { 
            key: 'room_id', 
            label: 'Ruang', 
            width: '12%',
            render: (item) => ROOM_MAP[item.room_id] || item.room_id 
          },
          { 
            key: 'condition', 
            label: 'Kondisi', 
            width: '12%',
            render: (item) => (
              <Badge variant={STATUS_VARIANT[item.condition] || 'default'}>
                {CONDITION_LABELS[item.condition] || item.condition}
              </Badge>
            )
          },
          { 
            key: 'status', 
            label: 'Status', 
            width: '12%',
            render: (item) => (
              <Badge variant={STATUS_VARIANT[item.status] || 'default'}>
                {STATUS_LABELS[item.status] || item.status}
              </Badge>
            )
          }
        ];
      case TABS.BORROWINGS:
        return [
          { key: 'borrow_id', label: 'ID Pinjam', width: '12%' },
          { key: 'asset_id', label: 'ID Aset', width: '15%' },
          { key: 'borrower_name', label: 'Peminjam', width: '20%' },
          { key: 'borrower_position', label: 'Jabatan', width: '15%' },
          { 
            key: 'borrow_date', 
            label: 'Tgl Pinjam', 
            width: '13%', 
            render: (item) => formatDate(item.borrow_date) 
          },
          { 
            key: 'planned_return_date', 
            label: 'Rencana Kembali', 
            width: '13%', 
            render: (item) => formatDate(item.planned_return_date) 
          },
          { 
            key: 'status', 
            label: 'Status', 
            width: '12%',
            render: (item) => (
              <Badge variant={item.status === 'BORROWED' ? 'info' : 'success'}>
                {item.status === 'BORROWED' ? 'Sedang Dipinjam' : 'Kembali'}
              </Badge>
            )
          }
        ];
      case TABS.MAINTENANCES:
        return [
          { key: 'ticket_id', label: 'ID Tiket', width: '12%' },
          { key: 'asset_id', label: 'ID Aset', width: '15%' },
          { key: 'issue_type', label: 'Masalah', width: '18%' },
          { key: 'description', label: 'Kerusakan', width: '25%' },
          { key: 'technician', label: 'Teknisi', width: '15%' },
          { 
            key: 'status', 
            label: 'Status', 
            width: '15%',
            render: (item) => (
              <Badge variant={STATUS_VARIANT[item.status] || 'default'}>
                {STATUS_LABELS[item.status] || item.status}
              </Badge>
            )
          }
        ];
      case TABS.OPNAME:
        return [
          { key: 'asset_id', label: 'ID Aset', width: '15%' },
          { key: 'item_name', label: 'Nama Aset', width: '25%' },
          { 
            key: 'last_inspected_at', 
            label: 'Inspeksi Terakhir', 
            width: '20%',
            render: (item) => formatDate(item.last_inspected_at) 
          },
          { 
            key: 'opname_status', 
            label: 'Status Opname', 
            width: '20%',
            render: (item) => {
              if (item.opname_status === 'VERIFIED') {
                return <Badge variant="success">Terverifikasi</Badge>;
              }
              if (item.opname_status === 'OVERDUE') {
                return <Badge variant="danger">Terlambat</Badge>;
              }
              return <Badge variant="warning">Menunggu Inspeksi</Badge>;
            }
          },
          { 
            key: 'days_since_last_inspection', 
            label: 'Selisih Hari', 
            width: '20%',
            render: (item) => {
              if (item.days_since_last_inspection === null || item.days_since_last_inspection === undefined) return '—';
              return `${item.days_since_last_inspection} hari lalu`;
            }
          }
        ];
      default:
        return [];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case TABS.ASSETS: return 'Laporan Daftar Aset Lengkap';
      case TABS.BORROWINGS: return 'Laporan Transaksi Peminjaman';
      case TABS.MAINTENANCES: return 'Laporan Penanganan Perbaikan';
      case TABS.OPNAME: return 'Laporan Stock Opname Aset';
      default: return 'Laporan';
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.subtext}>Ekspor dan cetak laporan inventaris sekolah untuk keperluan rapat, pengawasan, dan pelaporan keuangan.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handlePrint}
          icon={<Printer size={18} />}
        >
          Cetak Laporan
        </Button>
      </div>

      {/* Tabs Row */}
      <div className={styles.tabsCard}>
        <div className={styles.tabsWrapper}>
          <button 
            className={`${styles.tabBtn} ${activeTab === TABS.ASSETS ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(TABS.ASSETS)}
          >
            <Database size={16} className={styles.tabIcon} />
            Laporan Aset
          </button>
          
          <button 
            className={`${styles.tabBtn} ${activeTab === TABS.BORROWINGS ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(TABS.BORROWINGS)}
          >
            <ArrowLeftRight size={16} className={styles.tabIcon} />
            Laporan Peminjaman
          </button>
          
          <button 
            className={`${styles.tabBtn} ${activeTab === TABS.MAINTENANCES ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(TABS.MAINTENANCES)}
          >
            <Wrench size={16} className={styles.tabIcon} />
            Laporan Perbaikan
          </button>
          
          <button 
            className={`${styles.tabBtn} ${activeTab === TABS.OPNAME ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(TABS.OPNAME)}
          >
            <CheckSquare size={16} className={styles.tabIcon} />
            Stock Opname
          </button>
        </div>
      </div>

      {/* Print View Header (Hidden in Screen View) */}
      <div className={styles.printHeader}>
        <h2>SISTEM INVENTARIS MANAJEMEN ASET SEKOLAH (SISMA)</h2>
        <h3>{getTabTitle()}</h3>
        <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      {/* Table Content */}
      <div className={styles.tableWrapper}>
        <DataTable
          columns={getColumns()}
          data={data}
          loading={loading}
          emptyMessage="Tidak ada data laporan ditemukan untuk periode/tab ini"
        />
      </div>

      {/* Print View Footer */}
      <div className={styles.printFooter}>
        <div className={styles.signBlock}>
          <p>Disetujui Oleh,</p>
          <div className={styles.signLine} />
          <p>Kepala Tata Usaha / Kepala Sekolah</p>
        </div>
      </div>
    </div>
  );
}
