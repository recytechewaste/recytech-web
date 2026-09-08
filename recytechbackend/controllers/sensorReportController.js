const SensorReport = require('../models/SensorReport');
const RecyclingCenter = require('../models/RecyclingCenter');
const PartnerOrganization = require('../models/PartnerOrganization');

/**
 * @desc    Submit a new sensor/bin malfunction report (Partner Org / LGU or Mobile App)
 * @route   POST /api/sensor-reports
 * @access  Private (Partner Org, Staff)
 */
const submitSensorReport = async (req, res) => {
    try {
        const { binId, sensorType, issueDescription, severity, partnerOrgId: explicitPartnerOrgId } = req.body;

        if (!binId || !issueDescription) {
            return res.status(400).json({ 
                success: false, 
                message: 'binId and issueDescription are required.' 
            });
        }

        // Verify that the Bin (RecyclingCenter) exists
        const bin = await RecyclingCenter.findById(binId);
        if (!bin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Target recycling bin was not found.' 
            });
        }

        // Find Partner Org ID either from logged in user or explicit body or bin's assignedLgu
        let resolvedPartnerOrgId = explicitPartnerOrgId;
        let reporterInfo = {
            name: req.user?.name || req.user?.username || 'Partner Representative',
            email: req.user?.email || '',
            phone: req.user?.phone || '',
            role: req.user?.role || 'Partner Organization'
        };

        if (!resolvedPartnerOrgId && req.user) {
            const org = await PartnerOrganization.findOne({ user: req.user._id });
            if (org) {
                resolvedPartnerOrgId = org._id;
                reporterInfo.name = org.name || org.contactPerson || reporterInfo.name;
                reporterInfo.email = org.email || reporterInfo.email;
                reporterInfo.phone = org.phone || reporterInfo.phone;
            } else if (bin.assignedLgu) {
                resolvedPartnerOrgId = bin.assignedLgu;
            }
        }

        if (!resolvedPartnerOrgId && bin.assignedLgu) {
            resolvedPartnerOrgId = bin.assignedLgu;
        }

        // Fallback: If still no partnerOrgId found, check if any partner org exists
        if (!resolvedPartnerOrgId) {
            const fallbackOrg = await PartnerOrganization.findOne();
            if (fallbackOrg) {
                resolvedPartnerOrgId = fallbackOrg._id;
            }
        }

        if (!resolvedPartnerOrgId) {
            return res.status(400).json({
                success: false,
                message: 'Could not associate report with a valid Partner Organization.'
            });
        }

        // Create the report
        const report = await SensorReport.create({
            binId,
            partnerOrgId: resolvedPartnerOrgId,
            reportedBy: reporterInfo,
            sensorType: sensorType || 'Fill Level Sensor (Ultrasonic)',
            issueDescription,
            severity: severity || 'Medium',
            status: 'Pending'
        });

        // If High or Critical severity, mark the bin in Maintenance state automatically
        if (['High', 'Critical'].includes(report.severity)) {
            await RecyclingCenter.findByIdAndUpdate(binId, { status: 'Maintenance' });
        }

        const populatedReport = await SensorReport.findById(report._id)
            .populate('binId', 'name address status capacityKg currentFillKg qrCode')
            .populate('partnerOrgId', 'name contactPerson email phone jurisdiction');

        return res.status(201).json({
            success: true,
            message: 'Sensor malfunction report submitted successfully.',
            data: populatedReport
        });
    } catch (error) {
        console.error('Error submitting sensor report:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit sensor report.',
            error: error.message
        });
    }
};

/**
 * @desc    Get reports submitted by the logged-in Partner Org
 * @route   GET /api/sensor-reports/my-reports
 * @access  Private (Partner Org)
 */
const getMyReports = async (req, res) => {
    try {
        let partnerOrgId = null;
        if (req.user) {
            const org = await PartnerOrganization.findOne({ user: req.user._id });
            if (org) {
                partnerOrgId = org._id;
            }
        }

        if (!partnerOrgId) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        const reports = await SensorReport.find({ partnerOrgId })
            .populate('binId', 'name address status capacityKg currentFillKg')
            .populate('resolvedBy', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching partner sensor reports:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sensor reports.',
            error: error.message
        });
    }
};

/**
 * @desc    Get all sensor reports with query filtering (STAFF ONLY)
 * @route   GET /api/sensor-reports
 * @access  Private (Staff only)
 */
const getAllReports = async (req, res) => {
    try {
        const { status, severity, sensorType, binId, search, page = 1, limit = 20 } = req.query;

        const query = {};

        if (status && status !== 'All') {
            query.status = status;
        }

        if (severity && severity !== 'All') {
            query.severity = severity;
        }

        if (sensorType && sensorType !== 'All') {
            query.sensorType = sensorType;
        }

        if (binId) {
            query.binId = binId;
        }

        let reportsQuery = SensorReport.find(query)
            .populate('binId', 'name address status capacityKg currentFillKg qrCode')
            .populate('partnerOrgId', 'name contactPerson email phone jurisdiction')
            .populate('resolvedBy', 'name email role')
            .sort({ createdAt: -1 });

        const skip = (parseInt(page) - 1) * parseInt(limit);
        reportsQuery = reportsQuery.skip(skip).limit(parseInt(limit));

        let reports = await reportsQuery.exec();

        // Optional search filter across bin name/address, reporter, description
        if (search && search.trim() !== '') {
            const s = search.trim().toLowerCase();
            reports = reports.filter(r => {
                const binName = r.binId?.name?.toLowerCase() || '';
                const binAddr = r.binId?.address?.toLowerCase() || '';
                const orgName = r.partnerOrgId?.name?.toLowerCase() || '';
                const reporterName = r.reportedBy?.name?.toLowerCase() || '';
                const reporterEmail = r.reportedBy?.email?.toLowerCase() || '';
                const desc = r.issueDescription?.toLowerCase() || '';
                const notes = r.resolutionNotes?.toLowerCase() || '';
                return binName.includes(s) || binAddr.includes(s) || orgName.includes(s) ||
                       reporterName.includes(s) || reporterEmail.includes(s) ||
                       desc.includes(s) || notes.includes(s);
            });
        }

        const total = await SensorReport.countDocuments(query);

        return res.status(200).json({
            success: true,
            count: reports.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: reports
        });
    } catch (error) {
        console.error('Error fetching all sensor reports:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sensor reports.',
            error: error.message
        });
    }
};

/**
 * @desc    Get aggregate KPI stats for sensor reports (STAFF ONLY)
 * @route   GET /api/sensor-reports/stats
 * @access  Private (Staff only)
 */
const getReportStats = async (req, res) => {
    try {
        const [total, pending, inProgress, resolved, dismissed, critical] = await Promise.all([
            SensorReport.countDocuments(),
            SensorReport.countDocuments({ status: 'Pending' }),
            SensorReport.countDocuments({ status: 'In Progress' }),
            SensorReport.countDocuments({ status: 'Resolved' }),
            SensorReport.countDocuments({ status: 'Dismissed' }),
            SensorReport.countDocuments({ severity: { $in: ['Critical', 'High'] }, status: { $ne: 'Resolved' } })
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                total,
                pending,
                inProgress,
                resolved,
                dismissed,
                critical
            }
        });
    } catch (error) {
        console.error('Error fetching sensor report stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sensor report statistics.',
            error: error.message
        });
    }
};

/**
 * @desc    Get single sensor report details
 * @route   GET /api/sensor-reports/:id
 * @access  Private (Staff, reporting Partner Org)
 */
const getReportById = async (req, res) => {
    try {
        const report = await SensorReport.findById(req.params.id)
            .populate('binId', 'name address status capacityKg currentFillKg qrCode')
            .populate('partnerOrgId', 'name contactPerson email phone jurisdiction')
            .populate('resolvedBy', 'name email role');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Sensor report not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error fetching report details:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch report details.',
            error: error.message
        });
    }
};

/**
 * @desc    Update sensor report status & resolution notes (STAFF ONLY)
 * @route   PATCH /api/sensor-reports/:id/status
 * @access  Private (Staff only)
 */
const updateReportStatus = async (req, res) => {
    try {
        const { status, resolutionNotes, restoreBinStatus } = req.body;

        const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Dismissed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const report = await SensorReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Sensor report not found.'
            });
        }

        if (status) report.status = status;
        if (resolutionNotes !== undefined) report.resolutionNotes = resolutionNotes;

        if (['Resolved', 'Dismissed'].includes(status)) {
            report.resolvedBy = req.user._id;
            report.resolvedAt = new Date();

            // If requested or if status is Resolved, restore bin status to Operational/Active
            if (restoreBinStatus !== false) {
                await RecyclingCenter.findByIdAndUpdate(report.binId, { status: 'Operational' });
            }
        } else if (status === 'In Progress') {
            // Keep bin in Maintenance while being worked on
            await RecyclingCenter.findByIdAndUpdate(report.binId, { status: 'Maintenance' });
        }

        await report.save();

        const updatedReport = await SensorReport.findById(report._id)
            .populate('binId', 'name address status capacityKg currentFillKg qrCode')
            .populate('partnerOrgId', 'name contactPerson email phone jurisdiction')
            .populate('resolvedBy', 'name email role');

        return res.status(200).json({
            success: true,
            message: `Sensor report status updated to ${status}.`,
            data: updatedReport
        });
    } catch (error) {
        console.error('Error updating sensor report status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update report status.',
            error: error.message
        });
    }
};

module.exports = {
    submitSensorReport,
    getMyReports,
    getAllReports,
    getReportStats,
    getReportById,
    updateReportStatus
};
