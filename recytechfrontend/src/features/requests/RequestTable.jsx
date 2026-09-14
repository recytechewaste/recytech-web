import React from 'react';
import { Trash2, Building2, Truck, MapPin, User, Calendar, AlertTriangle, UserCheck, Edit3, CheckCircle, Clock, Wrench } from 'lucide-react';
import styles from '../../styles/BinCollectionRequests.module.css';
import Skeleton from '../../components/Skeleton';

const RequestTable = ({ requests, loading, limit, onSelectRequest }) => {
  const getStatusPill = (status) => {
    const raw = (status || '').trim().toLowerCase().replace(/[\s_-]/g, '');
    switch (raw) {
      case 'pending':
        return (
          <span className={`${styles.statusBadge} ${styles.pending}`}>
            <Clock size={12} /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className={`${styles.statusBadge} ${styles.approved}`}>
            <CheckCircle size={12} /> Approved
          </span>
        );
      case 'assigned':
        return (
          <span className={`${styles.statusBadge} ${styles.assigned}`}>
            <UserCheck size={12} /> Assigned
          </span>
        );
      case 'scheduled':
        return (
          <span className={`${styles.statusBadge} ${styles.scheduled}`}>
            <Calendar size={12} /> Scheduled
          </span>
        );
      case 'intransit':
        return (
          <span className={`${styles.statusBadge} ${styles.inTransit}`}>
            <Truck size={12} /> In Transit
          </span>
        );
      case 'inprogress':
        return (
          <span className={`${styles.statusBadge} ${styles.inProgress}`}>
            <Wrench size={12} /> In Progress
          </span>
        );
      case 'arrived':
        return (
          <span className={`${styles.statusBadge} ${styles.arrived}`}>
            <MapPin size={12} /> Arrived
          </span>
        );
      case 'completed':
        return (
          <span className={`${styles.statusBadge} ${styles.completed}`}>
            <CheckCircle size={12} /> Completed
          </span>
        );
      case 'cancelled':
      case 'canceled':
      case 'rejected':
        return (
          <span className={`${styles.statusBadge} ${styles.cancelled}`}>
            Cancelled
          </span>
        );
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.pending}`}>
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const SkeletonRow = () => (
    <tr>
      <td className={styles.td}><Skeleton width="90px" height="24px" borderRadius="4px" /></td>
      <td className={styles.td}><Skeleton width="130px" height="18px" /></td>
      <td className={styles.td}><Skeleton width="180px" height="18px" /></td>
      <td className={styles.td}><Skeleton width="80px" height="24px" borderRadius="12px" /></td>
      <td className={styles.td}><Skeleton width="110px" height="18px" /></td>
      <td className={styles.td}><Skeleton width="90px" height="18px" /></td>
      <td className={styles.td} style={{ textAlign: 'right' }}><Skeleton width="70px" height="30px" borderRadius="6px" /></td>
    </tr>
  );

  return (
    <div className={styles.card}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Bin Name</th>
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
              const isCancelled = statusLower === 'cancelled' || statusLower === 'canceled' || statusLower === 'rejected';

              return (
                <tr key={request._id}>
                  <td className={styles.td}>
                    <span className={styles.plateBadge}>
                      <Trash2 size={14}/>
                      {request.bin?.name || request.bin?.binId || 'N/A'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.iconText}>
                      <Building2 size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                      <span>{request.lgu?.name || request.bin?.assignedLgu?.name || 'N/A'}</span>
                    </div>
                  </td>
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
                        title="Edit dispatch or change assigned collector"
                      >
                        <Edit3 size={14} /> Edit
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
