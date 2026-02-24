import { MongoClient } from 'mongodb';
import dbConnect from '../../lib/dbConnect.js';
import Referral from '../../models/Referral.js';

// CORS middleware
const corsMiddleware = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
};

export default async function handler(req, res) {
    console.log('Referrals API called with:', {
        method: req.method,
        query: req.query,
        body: req.body
    });

    // Handle CORS
    if (await corsMiddleware(req, res)) {
        return;
    }

    try {
        await dbConnect();

        switch (req.method) {
            case 'POST':
                console.log('Processing POST request');
                const { referrerId, userId, userData } = req.body;

                // Validate required fields
                if (!referrerId || !userId) {
                    return res.status(400).json({
                        success: false,
                        message: 'ReferrerId and userId are required'
                    });
                }

                // Check if referral already exists
                const existingReferral = await Referral.findOne({ userId });
                if (existingReferral) {
                    return res.status(400).json({
                        success: false,
                        message: 'User is already referred'
                    });
                }

                // Create new referral
                const newReferral = new Referral({
                    referrerId,
                    userId,
                    userData: {
                        first_name: userData?.first_name || '',
                        last_name: userData?.last_name || '',
                        username: userData?.username || '',
                        language_code: userData?.language_code || '',
                        photo_url: userData?.photo_url || ''
                    },
                    joinedAt: new Date(),
                    rewardClaimed: false
                });

                await newReferral.save();
                console.log('New referral saved:', newReferral);

                return res.status(200).json({
                    success: true,
                    data: newReferral
                });

            case 'GET':
                console.log('Processing GET request');
                // Debug endpoint
                if (req.query.debug === 'true') {
                    const allReferrals = await Referral.find({});
                    console.log('All referrals:', allReferrals);
                    return res.status(200).json(allReferrals);
                }

                // Normal get by referrerId
                const { userId: referrerIdQuery } = req.query;
                if (!referrerIdQuery) {
                    return res.status(400).json({
                        success: false,
                        message: 'UserId is required'
                    });
                }

                const referrals = await Referral.find({ referrerId: referrerIdQuery });
                console.log(`Found ${referrals.length} referrals for user ${referrerIdQuery}`);

                return res.status(200).json({
                    success: true,
                    data: referrals
                });

            case 'PUT':
                console.log('Processing PUT request');
                const { referralId } = req.body;

                if (!referralId) {
                    return res.status(400).json({
                        success: false,
                        message: 'ReferralId is required'
                    });
                }

                const updatedReferral = await Referral.findByIdAndUpdate(
                    referralId,
                    { rewardClaimed: true },
                    { new: true }
                );

                if (!updatedReferral) {
                    return res.status(404).json({
                        success: false,
                        message: 'Referral not found'
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: updatedReferral
                });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'OPTIONS']);
                return res.status(405).json({
                    success: false,
                    message: `Method ${req.method} Not Allowed`
                });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
}