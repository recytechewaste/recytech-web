const mongoose = require('mongoose');

const sensorReportSchema = new mongoose.Schema({
    binId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecyclingCenter',
        required: [true, 'Bin reference (RecyclingCenter ID) is required']
    },
    partnerOrgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PartnerOrganization',
        required: [true, 'Partner Organization reference is required']
    },
    reportedBy: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        role: { type: String, default: 'Partner Organization' }
    },
    sensorType: {
        type: String,
        enum: [
            'Time-of-Flight (ToF) Fullness Sensor',
            'Fill Level Sensor (Ultrasonic)',
            'Weight Sensor (Load Cell)',
            'Power / Solar / Battery',
            'Connectivity / GSM / GPS',
            'Physical Lid / Motorized Lock',
            'Optical / Material Detection Sensor',
            'Other Hardware Failure'
        ],
        default: 'Time-of-Flight (ToF) Fullness Sensor'
    },
    issueDescription: {
        type: String,
        required: [true, 'Issue description is required'],
        trim: true
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Dismissed'],
        default: 'Pending'
    },
    resolutionNotes: {
        type: String,
        trim: true
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for rapid filtering
sensorReportSchema.index({ status: 1, severity: 1 });
sensorReportSchema.index({ partnerOrgId: 1 });
sensorReportSchema.index({ binId: 1 });

const SensorReport = mongoose.models.SensorReport || mongoose.model('SensorReport', sensorReportSchema);

module.exports = SensorReport;
