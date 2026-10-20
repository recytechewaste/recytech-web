const ConfirmAssignmentsModal = ({
    selectedCount,
    confirmMessage,
    confirming,
    onClose,
    onConfirm
}) => (
    <div
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}
    >
        <div
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '28px',
                maxWidth: '440px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #e2e8f0'
            }}
        >
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '18px', fontWeight: 700 }}>Confirm Collector Assignments</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13.5px', lineHeight: 1.5 }}>
                You are about to officially schedule and assign <strong>{selectedCount}</strong> collection request(s). Assigned collectors will be notified to begin their collection route.
            </p>

            {confirmMessage && (
                <div
                    style={{
                        padding: '12px 14px',
                        marginBottom: '20px',
                        borderRadius: '8px',
                        backgroundColor: confirmMessage.includes('Error') ? '#fef2f2' : '#ecfdf5',
                        border: `1px solid ${confirmMessage.includes('Error') ? '#fecaca' : '#a7f3d0'}`,
                        color: confirmMessage.includes('Error') ? '#991b1b' : '#065f46',
                        fontSize: '13px',
                        fontWeight: 500
                    }}
                >
                    {confirmMessage}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={confirming}
                    style={{
                        padding: '9px 18px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: confirming ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        transition: 'background 0.15s ease'
                    }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={confirming}
                    style={{
                        padding: '9px 20px',
                        backgroundColor: confirming ? '#94a3b8' : '#0f766e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: confirming ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        transition: 'background 0.15s ease'
                    }}
                >
                    {confirming ? 'Dispatching...' : 'Confirm & Dispatch'}
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmAssignmentsModal;
