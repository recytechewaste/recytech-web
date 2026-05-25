import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import AssignCollectorModal from '../features/requests/AssignCollectorModal';
import ConfirmAssignmentModal from '../features/requests/ConfirmAssignmentModal';
import RejectConfirmationModal from '../features/requests/RejectConfirmationModal';
import RequestFilters from '../features/requests/RequestFilters';
import RequestStats from '../features/requests/RequestStats';
import RequestTable from '../features/requests/RequestTable';
import SuccessModal from '../features/requests/SuccessModal';
import ViewRequestModal from '../features/requests/ViewRequestModal';
import styles from '../styles/RequestManagement.module.css';
import { useRequests } from '../features/requests/useRequests';

const RequestManagement = () => {
    const { requests, filteredRequests, collectors, wasteCategories, stats, filters, setFilters, handleClearFilters, fetchData } = useRequests();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [successTitle, setSuccessTitle] = useState('');
    const [viewRequest, setViewRequest] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedCollector, setSelectedCollector] = useState('');
    const [selectedScheduleDate, setSelectedScheduleDate] = useState('');
    const [selectedScheduleTime, setSelectedScheduleTime] = useState('');
    const [scheduleConflict, setScheduleConflict] = useState('');
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [rejectingRequestId, setRejectingRequestId] = useState(null);

    useEffect(() => {
        if (!selectedCollector || !selectedScheduleDate || !selectedScheduleTime || !selectedRequest) {
            setScheduleConflict('');
            return;
        }

        const scheduledAt = new Date(`${selectedScheduleDate}T${selectedScheduleTime}`);
        const hasConflict = requests.some((request) => {
            if (!request.assignedCollector || !request.scheduledAt || request._id === selectedRequest._id) return false;
            if (request.assignedCollector._id !== selectedCollector) return false;

            const otherTime = new Date(request.scheduledAt);
            return otherTime.getTime() === scheduledAt.getTime() && ['Pending', 'Approved', 'In-Transit'].includes(request.status);
        });

        setScheduleConflict(hasConflict ? 'Selected collector already has another request at the same scheduled date and time.' : '');
    }, [selectedCollector, selectedScheduleDate, selectedScheduleTime, requests, selectedRequest]);

    const resetAssignmentForm = () => {
        setSelectedCollector('');
        setSelectedScheduleDate('');
        setSelectedScheduleTime('');
        setScheduleConflict('');
    };

    const closeAssignmentModal = () => {
        setSelectedRequest(null);
        resetAssignmentForm();
    };

    const handleApproveClick = (request) => {
        setSelectedRequest(request);
        if (viewRequest) setViewRequest(null);

        if (request.scheduledAt) {
            const dateTime = new Date(request.scheduledAt);
            setSelectedScheduleDate(dateTime.toISOString().substring(0, 10));
            setSelectedScheduleTime(dateTime.toTimeString().substring(0, 5));
        } else {
            setSelectedScheduleDate('');
            setSelectedScheduleTime('');
        }

        setSelectedCollector(request.assignedCollector?._id || '');
        setScheduleConflict('');
    };

    const confirmAssignment = () => {
        if (!selectedCollector) return alert('Please select a collector');
        if (!selectedScheduleDate || !selectedScheduleTime) return alert('Please select a scheduled date and time.');
        if (scheduleConflict) return alert(scheduleConflict);
        setShowAssignmentModal(true);
    };

    const executeAssignment = async () => {
        try {
            const scheduledAt = `${selectedScheduleDate}T${selectedScheduleTime}`;
            await api.put(`/requests/${selectedRequest._id}`, {
                status: 'Approved',
                assignedCollector: selectedCollector,
                scheduledAt
            });

            setSuccessTitle('Request Approved');
            setSuccessMessage('The pickup request has been successfully approved, assigned, and scheduled.');
            setShowSuccessModal(true);
            setShowAssignmentModal(false);
            setSelectedRequest(null);
            resetAssignmentForm();
            fetchData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Unable to approve the request.');
        }
    };

    const confirmReject = async () => {
        try {
            await api.put(`/requests/${rejectingRequestId}`, { status: 'Rejected' });
            setSuccessTitle('Request Rejected');
            setSuccessMessage('The pickup request has been successfully marked as Rejected.');
            setShowSuccessModal(true);
            setRejectingRequestId(null);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Request Management" />
            <div className={styles.main}>
                <div className={styles.headerContainer}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.pageTitle}>Request Management</h1>
                        <p className={styles.subTitle}>Monitor and verify e-waste pickup requests within your jurisdiction.</p>
                    </div>
                </div>

                <RequestFilters
                    filters={filters}
                    wasteCategories={wasteCategories}
                    onFilterChange={setFilters}
                    onClearFilters={handleClearFilters}
                />
                <RequestStats stats={stats} />
                <RequestTable
                    requests={filteredRequests}
                    onView={setViewRequest}
                    onApprove={handleApproveClick}
                    onReject={setRejectingRequestId}
                />

                <ViewRequestModal
                    request={viewRequest}
                    onClose={() => setViewRequest(null)}
                    onApprove={handleApproveClick}
                />

                {selectedRequest && !showAssignmentModal && (
                    <AssignCollectorModal
                        request={selectedRequest}
                        collectors={collectors}
                        selectedCollector={selectedCollector}
                        selectedScheduleDate={selectedScheduleDate}
                        selectedScheduleTime={selectedScheduleTime}
                        scheduleConflict={scheduleConflict}
                        onCollectorChange={setSelectedCollector}
                        onDateChange={setSelectedScheduleDate}
                        onTimeChange={setSelectedScheduleTime}
                        onCancel={closeAssignmentModal}
                        onAssign={confirmAssignment}
                    />
                )}

                {showAssignmentModal && (
                    <ConfirmAssignmentModal
                        collectors={collectors}
                        selectedCollector={selectedCollector}
                        onCancel={() => setShowAssignmentModal(false)}
                        onConfirm={executeAssignment}
                    />
                )}

                {showSuccessModal && (
                    <SuccessModal
                        title={successTitle}
                        message={successMessage}
                        onContinue={() => setShowSuccessModal(false)}
                    />
                )}

                {rejectingRequestId && (
                    <RejectConfirmationModal
                        onCancel={() => setRejectingRequestId(null)}
                        onConfirm={confirmReject}
                    />
                )}
            </div>
        </div>
    );
};

export default RequestManagement;
