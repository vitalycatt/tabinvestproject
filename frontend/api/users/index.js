// pages/api/users/index.js
import dbConnect from '@/lib/dbConnect'
import User from '@/models/User'

export default async function handler(req, res) {
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const users = await User.find({})
                res.status(200).json({ success: true, data: users })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'POST':
            try {
                const user = await User.create(req.body)
                res.status(201).json({ success: true, data: user })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        default:
            res.status(400).json({ success: false })
            break
    }
}

// pages/api/users/[id].js
export default async function handler(req, res) {
    const { id } = req.query
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const user = await User.findOne({ telegramId: id })
                if (!user) {
                    return res.status(404).json({ success: false, error: 'User not found' })
                }
                res.status(200).json({ success: true, data: user })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'PUT':
            try {
                const user = await User.findOneAndUpdate(
                    { telegramId: id },
                    req.body,
                    { new: true, runValidators: true }
                )
                if (!user) {
                    return res.status(404).json({ success: false, error: 'User not found' })
                }
                res.status(200).json({ success: true, data: user })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'DELETE':
            try {
                const user = await User.findOneAndDelete({ telegramId: id })
                if (!user) {
                    return res.status(404).json({ success: false, error: 'User not found' })
                }
                res.status(200).json({ success: true, data: {} })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        default:
            res.status(400).json({ success: false })
            break
    }
}