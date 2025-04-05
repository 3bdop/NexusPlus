import express from "express";
import db from "../db/connection.js";
import { ObjectId } from "mongodb";

const adminStat = express.Router();

// Data processing
async function getDashboardData() {
    try {
        const [
            totalUsers,
            totalCompanies,
            totalJobs,
            activeUsers,
            userDistribution,
            skillsData,
            experienceData,
            cvCount,
            recommendedJobs,
            industryData
        ] = await Promise.all([
            db.collection('users').countDocuments(),
            db.collection('company').countDocuments(),
            db.collection('job').countDocuments(),
            db.collection('session').countDocuments({ loggedIn: true }),
            db.collection('users').aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
                { $project: { role: "$_id", count: 1, _id: 0 } }
            ]).toArray(),
            db.collection('job').aggregate([
                { $unwind: "$skills" },
                { $group: { _id: "$skills", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]).toArray(),
            db.collection('job').aggregate([
                { $group: { _id: "$experience", count: { $sum: 1 } } }
            ]).toArray(),
            db.collection('users').countDocuments({ cvPath: { $exists: true, $ne: null } }),
            db.collection('users').aggregate([
                {
                    $addFields: {
                        recommended_jobs: { $ifNull: ["$recommended_jobs", []] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $size: "$recommended_jobs" } }
                    }
                }
            ]).toArray(),
            db.collection('company').aggregate([
                { $group: { _id: "$industry", count: { $sum: 1 } } },
                { $project: { industry: "$_id", count: 1, _id: 0 } }
            ]).toArray()
        ]);

        return {
            kpis: {
                totalUsers,
                totalCompanies,
                totalJobs,
                activeUsers,
                cvCount,
                recommendedJobs: recommendedJobs[0]?.total || 0
            },
            charts: {
                userDistribution: {
                    type: 'doughnut',
                    data: {
                        labels: userDistribution.map(d => d.role),
                        datasets: [{
                            data: userDistribution.map(d => d.count),
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                        }]
                    }
                },
                topSkills: {
                    type: 'bar',
                    data: {
                        labels: skillsData.map(d => d._id),
                        datasets: [{
                            label: 'Job Count',
                            data: skillsData.map(d => d.count),
                            backgroundColor: '#4CAF50'
                        }]
                    }
                },
                experienceDistribution: {
                    type: 'pie',
                    data: {
                        labels: experienceData.map(d => d._id),
                        datasets: [{
                            data: experienceData.map(d => d.count),
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                        }]
                    }
                },
                industryDistribution: {
                    type: 'pie',
                    data: {
                        labels: industryData.map(d => d.industry),
                        datasets: [{
                            data: industryData.map(d => d.count),
                            backgroundColor: [
                                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                '#9966FF', '#FF9F40', '#00CC99', '#FF99CC'
                            ]
                        }]
                    }
                }
            }
        };
    } catch (err) {
        console.error('Data processing error:', err);
        throw err;
    }
}

// Dashboard route
adminStat.get('/adminStat', async (req, res) => {
    try {
        const data = await getDashboardData();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default adminStat;