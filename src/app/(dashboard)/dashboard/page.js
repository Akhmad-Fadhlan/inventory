'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { dashboardApi } from '@/lib/api';
import { 
  STATUS_VARIANT, 
  TRANSACTION_LABELS, 
  ROLES 
} from '@/lib/constants';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import ChartCard from '@/components/ChartCard';
import { useToast } from '@/components/Providers';
import { 
  Package, 
  CheckCircle, 
  ArrowLeftRight, 
  Wrench, 
  AlertTriangle,
  History
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import styles from './page.module.css';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMounted, setChartMounted] = useState(false);

  useEffect(() => {
    setChartMounted(true);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const user = session?.user;
      if (!user) return;

      let res;
      if (user.role === ROLES.SUPER_ADMIN) {
        res = await dashboardApi.global();
      } else {
        res = await dashboardApi.branch(user.branch_id);
      }

      if (res.success) {
        setData(res.data);
      } else {
        showToast(res.message || 'Gagal memuat data dashboard', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi ke server gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const userName = session?.user?.name || 'User';

  // Prepare chart data
  const statusData = data?.status_breakdown ? [
    { name: 'Tersedia', value: data.status_breakdown.AVAILABLE || 0, color: '#38a169' },
    { name: 'Dipinjam', value: data.status_breakdown.BORROWED || 0, color: '#3182ce' },
    { name: 'Perbaikan', value: data.status_breakdown.MAINTENANCE || 0, color: '#dd6b20' },
    { name: 'Rusak', value: data.status_breakdown.DAMAGED || 0, color: '#e53e3e' },
  ].filter(item => item.value > 0) : [];

  const conditionData = data?.condition_breakdown ? [
    { name: 'Baik', jumlah: data.condition_breakdown.GOOD || 0, fill: '#38a169' },
    { name: 'Rusak Ringan', jumlah: data.condition_breakdown.MINOR_DAMAGE || 0, fill: '#dd6b20' },
    { name: 'Rusak Berat', jumlah: data.condition_breakdown.MAJOR_DAMAGE || 0, fill: '#e53e3e' },
  ] : [];

  // Recent Transactions columns
  const columns = [
    { 
      key: 'transaction_id', 
      label: 'ID Transaksi' 
    },
    { 
      key: 'asset_id', 
      label: 'ID Aset' 
    },
    {
      key: 'type',
      label: 'Tipe',
      render: (item) => (
        <Badge variant={STATUS_VARIANT[item.type] || 'default'}>
          {TRANSACTION_LABELS[item.type] || item.type}
        </Badge>
      )
    },
    { 
      key: 'notes', 
      label: 'Deskripsi / Catatan',
      render: (item) => <span className={styles.notesText}>{item.notes || '-'}</span>
    },
    { 
      key: 'operator_name', 
      label: 'Oleh' 
    },
    { 
      key: 'created_at', 
      label: 'Tanggal',
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
      {/* Welcome Header */}
      <div className={styles.header}>
        <h2 className={styles.welcomeTitle}>Selamat Datang, {userName}!</h2>
        <p className={styles.welcomeSub}>Berikut adalah ringkasan inventaris manajemen aset sekolah saat ini.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid-stats">
        <StatsCard 
          title="Total Aset" 
          value={loading ? 0 : data?.total_assets || 0} 
          icon={Package} 
          color="primary"
          loading={loading}
          delay="0.05s"
        />
        <StatsCard 
          title="Tersedia" 
          value={loading ? 0 : data?.status_breakdown?.AVAILABLE || 0} 
          icon={CheckCircle} 
          color="success"
          loading={loading}
          delay="0.1s"
        />
        <StatsCard 
          title="Dipinjam" 
          value={loading ? 0 : data?.status_breakdown?.BORROWED || 0} 
          icon={ArrowLeftRight} 
          color="info"
          loading={loading}
          delay="0.15s"
        />
        <StatsCard 
          title="Dalam Perbaikan" 
          value={loading ? 0 : data?.status_breakdown?.MAINTENANCE || 0} 
          icon={Wrench} 
          color="warning"
          loading={loading}
          delay="0.2s"
        />
        <StatsCard 
          title="Rusak" 
          value={loading ? 0 : data?.status_breakdown?.DAMAGED || 0} 
          icon={AlertTriangle} 
          color="danger"
          loading={loading}
          delay="0.25s"
        />
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        <ChartCard 
          title="Distribusi Status Aset" 
          subtitle="Persentase status kepemilikan aset"
          loading={loading}
        >
          {chartMounted && statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Aset`, 'Jumlah']} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          ) : chartMounted && !loading ? (
            <div className={styles.noDataChart}>Tidak ada data distribusi status</div>
          ) : null}
        </ChartCard>

        <ChartCard 
          title="Kondisi Aset saat Ini" 
          subtitle="Jumlah aset berdasarkan kualitas fisik"
          loading={loading}
        >
          {chartMounted && data?.condition_breakdown ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conditionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--color-foreground-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-foreground-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--color-surface-hover)' }} formatter={(value) => [`${value} Aset`, 'Jumlah']} />
                <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </div>

      {/* Recent Transactions Table */}
      <div className={styles.transactionsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderTitle}>
            <History size={20} className={styles.sectionHeaderIcon} />
            <h3>Aktivitas Terbaru</h3>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={data?.recent_transactions || []}
          loading={loading}
          emptyMessage="Belum ada transaksi atau aktivitas aset baru"
        />
      </div>
    </div>
  );
}
