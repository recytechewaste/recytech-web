import React from 'react';
import { Truck, MapPin, User, Calendar, AlertTriangle, UserCheck, Edit3, CheckCircle } from 'lucide-react';
import styles from '../../styles/BinCollectionRequests.module.css';
import Skeleton from '../../components/Skeleton';

const RequestTable = ({ requests, loading, limit, onSelectRequest }) => {
  const getStatusPill = (status) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'pending':
        return <span className={`${styles.statusBadge} ${styles.pending}`}>Pending</span>;
      case 'approved':
        return <span className={`${styles.statusBadge} ${styles.inProgress}`} style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>Approved</span>;
      case 'assigned':
      case 'in-progress':
      case 'scheduled':
      case 'in-transit':
        return <span className={`${styles.statusBadge} ${styles.inProgress}`}>In Progress</span>;
      case 'completed':
        return <span className={`${styles.statusBadge} ${styles.completed}`}>Completed</span>;
      case 'cancelled':
        return <span className={`${styles.statusBadge} ${styles.cancelled}`}>Cancelled</span>;
      default:
        return <span className={styles.statusBadge}>{status || 'N/A'}</span>;
    }
  };

  const SkeletonRow = () => (
    <tr>
      <td className={styles.td}><Skeleton width="120px" height="24px" /></td>
      <td className={styles.td}><Skeleton width="150px" height="24px" /></td>
      <td className={styles.td}><Skeleton width="90%" height="24px" /></td>
      <td className={styles.td}><Skeleton width="100px" height="24px" borderRadius="12px" /></td>
      <td className={styles.td}><Skeleton width="180px" height="24px" /></td>
      <td className={styles.td}><Skeleton width="100px" height="24px" /></td>
      <td className={styles.td}><Skeleton width="110px" height="24px" /></td>
    </tr>
  );

  return (
    <div className={styles.card}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Bin ID</th>
            <th className={styles.th}>Partner Organization</th>
            <th className={styles.th}>Location</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Assigned Collector</th>
            <th className={styles.th}>Created At</th>
            <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(limit)].map((_, i) => <SkeletonRow key={i} />)
          ) : requests.length > 0 ? (
            requests.map((request) => {
              const statusLower = request.status?.toLowerCase();
              const isCompleted = statusLower === 'completed';
              const isCancelled = statusLower === 'cancelled';

              return (
                <tr key={request._id}>
                  <td className={styles.td}>
                    <span className={styles.plateBadge}>
                      <Truck size={14}/>
                      {request.bin?.name || request.bin?.binId || 'N/A'}
                    </span>
                  </td>
                  <td className={styles.td}>{request.lgu?.name || request.bin?.assignedLgu?.name || 'N/A'}</td>
                  <td className={styles.td}>
                      <div className={styles.iconText}>
                          <MapPin size={14}/>
                          <span>{request.bin?.address || 'N/A'}</span>
                      </div>
                  </td>
                  <td className={styles.td}>{getStatusPill(request.status)}</td>
                  <td className={styles.td}>
                    <div className={styles.iconText}>
                      <User size={14}/>
                      <span>
                        {request.assignedCollector ? `${request.assignedCollector.firstName} ${request.assignedCollector.lastName}` : 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className={styles.td}>
                      <div className={styles.iconText}>
                          <Calendar size={14}/>
                          <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    {statusLower === 'pending' ? (
                      <button 
                        onClick={() => onSelectRequest && onSelectRequest(request)}
                        className={styles.assignBtn}
                        title="Approve request and assign collector"
                      >
                        <UserCheck size={14} /> Assign & Approve
                      </button>
                    ) : isCompleted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: '#059669' }}>
                        <CheckCircle size={14} /> Done
                      </span>
                    ) : isCancelled ? (
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#991b1b' }}>
                        Cancelled
                      </span>
                    ) : (
                      <button 
                        onClick={() => onSelectRequest && onSelectRequest(request)}
                        className={styles.manageBtn}
                        title="Update status or change assigned collector"
                      >
                        <Edit3 size={14} /> Manage
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" className={styles.emptyTd}>
                <AlertTriangle size={48} className="mx-auto text-gray-400" />
                <p className="mt-2 text-lg font-semibold text-gray-700"><strong>No Requests Found</strong></p>
                <p className="text-gray-500">There are no collection requests matching your filters.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestTable;
