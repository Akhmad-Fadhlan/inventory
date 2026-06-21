import React from 'react';
import styles from './DataTable.module.css';
import { Inbox } from 'lucide-react';

export default function DataTable({
  columns,
  data = [],
  onRowClick,
  loading = false,
  emptyMessage = 'Tidak ada data untuk ditampilkan',
  emptyIcon: EmptyIcon = Inbox
}) {
  const handleRowClick = (item) => {
    if (onRowClick && !loading) {
      onRowClick(item);
    }
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.responsiveWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  style={col.width ? { width: col.width } : {}}
                  className={styles.th}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Render 5 skeleton rows
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className={styles.skeletonRow}>
                  {columns.map((col) => (
                    <td key={`skeleton-${rowIndex}-${col.key}`} className={styles.td}>
                      <div className={`skeleton ${styles.skeletonCell}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state row
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  <div className={styles.emptyContent}>
                    <EmptyIcon size={40} className={styles.emptyIcon} />
                    <p className={styles.emptyText}>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Render real data rows
              data.map((item, rowIndex) => (
                <tr 
                  key={item.id || rowIndex} 
                  onClick={() => handleRowClick(item)}
                  className={`${styles.row} ${onRowClick ? styles.clickable : ''}`}
                >
                  {columns.map((col) => (
                    <td key={`${item.id || rowIndex}-${col.key}`} className={styles.td}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
