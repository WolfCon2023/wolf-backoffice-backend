const Appointment = require('../models/appointment');
const Customer = require('../models/customer');
const User = require('../models/user');

// Get appointment trends (daily/weekly count)
exports.getAppointmentTrends = async (req, res) => {
    try {
        const trends = await Appointment.aggregate([
            {
                $match: {
                    toBeDeleted: { $ne: true },
                    date: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            },
            {
                $project: {
                    date: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.json(trends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get customer insights
exports.getCustomerInsights = async (req, res) => {
    try {
        const insights = await Customer.aggregate([
            {
                $facet: {
                    'byValue': [
                        {
                            $group: {
                                _id: '$highValue',
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                category: { $cond: [ "$_id", "High Value", "Regular" ] },
                                count: 1,
                                _id: 0
                            }
                        }
                    ],
                    'byProductLine': [
                        { $unwind: '$productLines' },
                        {
                            $group: {
                                _id: '$productLines',
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                category: '$_id',
                                count: 1,
                                _id: 0
                            }
                        }
                    ]
                }
            }
        ]);

        res.json(insights[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get location performance
exports.getLocationPerformance = async (req, res) => {
    try {
        const performance = await Appointment.aggregate([
            {
                $match: {
                    toBeDeleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: '$location',
                    appointments: { $sum: 1 }
                }
            },
            {
                $project: {
                    location: '$_id',
                    appointments: 1,
                    _id: 0
                }
            }
        ]);

        res.json(performance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get appointment statistics
exports.getAppointmentStatistics = async (req, res) => {
    try {
        const stats = await Appointment.aggregate([
            {
                $match: {
                    toBeDeleted: { $ne: true }
                }
            },
            {
                $facet: {
                    'byScheduler': [
                        {
                            $group: {
                                _id: '$scheduledBy',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    'byLocation': [
                        {
                            $group: {
                                _id: '$location',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    'total': [
                        {
                            $count: 'count'
                        }
                    ]
                }
            }
        ]);

        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Export analytics report
exports.exportAnalyticsReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        
        const data = await Promise.all([
            Appointment.find({
                date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                toBeDeleted: { $ne: true }
            }),
            Customer.find({
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
            })
        ]);

        // You'll need to implement the actual PDF generation here
        // For now, just sending JSON
        res.json({
            appointments: data[0],
            customers: data[1]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get business metrics
exports.getBusinessMetrics = async (req, res) => {
    try {
        const [appointments, customers, locations] = await Promise.all([
            // Appointment trends
            Appointment.aggregate([
                {
                    $match: {
                        toBeDeleted: { $ne: true },
                        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]),
            // Customer distribution
            Customer.aggregate([
                {
                    $group: {
                        _id: '$highValue',
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Location performance
            Appointment.aggregate([
                {
                    $match: { toBeDeleted: { $ne: true } }
                },
                {
                    $group: {
                        _id: '$location',
                        appointments: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            appointments: appointments.map(a => ({ date: a._id, count: a.count })),
            customers: customers.map(c => ({ 
                category: c._id ? 'High Value' : 'Regular',
                count: c.count 
            })),
            locations: locations.map(l => ({
                location: l._id,
                appointments: l.appointments,
                revenue: 0 // Since we don't have revenue data in the current schema
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};