// pages/api/settings/index.js
import dbConnect from '@/lib/dbConnect'
import GameSettings from '@/models/GameSettings'

export default async function handler(req, res) {
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const settings = await GameSettings.findOne({})
                    || await GameSettings.create({
                        tapValue: 1,
                        baseEnergy: 100,
                        energyRegenRate: 1,
                        incomeMultiplier: 1,
                        expMultiplier: 1
                    })
                res.status(200).json({ success: true, data: settings })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'PUT':
            try {
                const settings = await GameSettings.findOneAndUpdate(
                    {},
                    req.body,
                    { new: true, upsert: true }
                )
                res.status(200).json({ success: true, data: settings })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        default:
            res.status(405).json({ success: false, message: 'Method not allowed' })
            break
    }
}