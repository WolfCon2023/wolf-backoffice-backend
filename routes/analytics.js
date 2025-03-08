const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/appointments/trends', analyticsController.getAppointmentTrends);
router.get('/customers/insights', analyticsController.getCustomerInsights);
router.get('/locations/performance', analyticsController.getLocationPerformance);
router.get('/appointments/statistics', analyticsController.getAppointmentStatistics);
router.get('/business', analyticsController.getBusinessMetrics);
router.post('/export', analyticsController.exportAnalyticsReport);

module.exports = router;