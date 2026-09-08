import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import RequestTable from '../features/requests/RequestTable';
import RequestActionModal from '../features/requests/RequestActionModal';
import { useRequests } from '../features/requests/useRequests';
import RequestFilterBar from '../features/requests/RequestFilterBar';
import Pagination from '../components/Pagination';
import ErrorState from '../components/ErrorState';
import api from '../api/client';
import { CheckCircle } from 'lucide-react';
import styles from '../styles/BinCollectionRequests.module.css';

const ITEMS_PER_PAGE = 10;

const BinCollectionRequests = () => {
  const {
    requests,
    isLoading,
    error,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    handleClearFilters,
    currentPage,
    totalPages,
    setPage,
    refetchRequests,
  } = useRequests(ITEMS_PER_PAGE);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleUpdateRequest = async (requestId, updateData) => {
    try {
      const response = await api.put(`/requests/${requestId}`, updateData);
      if (refetchRequests) {
        refetchRequests();
      }
      setSuccessMessage('Collection request updated successfully. Collector and Partner Org dashboards updated.');
      setTimeout(() => setSuccessMessage(null), 5000);
      return response.data;
    } catch (err) {
      console.error('Failed to update collection request:', err);
      throw err;
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar activePage="Bin Collections" />
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.pageTitle}>Bin Collection Requests</h1>
            <p className={styles.subTitle}>Monitor all automated and manual collection requests for bins.</p>
          </div>
        </header>

        {successMessage && (
          <div style={{
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <CheckCircle size={18} color="#059669" />
            <span>{successMessage}</span>
          </div>
        )}

        <RequestFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          handleClearFilters={handleClearFilters}
        />

        {error && (
          <div style={{ marginBottom: '24px' }}>
            <ErrorState message={error} />
          </div>
        )}

        <RequestTable
          requests={requests}
          loading={isLoading}
          limit={ITEMS_PER_PAGE}
          onSelectRequest={(req) => setSelectedRequest(req)}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}

        {/* ── Assign & Approve Action Modal ── */}
        {selectedRequest && (
          <RequestActionModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onUpdateRequest={handleUpdateRequest}
          />
        )}
      </main>
    </div>
  );
};

export default BinCollectionRequests;
