// pages/api/admin/tasks/index.js
import dbConnect from '@/lib/dbConnect.js'
import Task from '@/models/Task.js'

export default async function handler(req, res) {
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const tasks = await Task.find({}).sort({ createdAt: -1 })
                res.status(200).json({ success: true, data: tasks })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'POST':
            try {
                const task = await Task.create(req.body)
                res.status(201).json({ success: true, data: task })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        default:
            res.status(405).json({ success: false, message: 'Method not allowed' })
            break
    }
}

// pages/api/admin/tasks/[id].js
export default async function handler(req, res) {
    const { id } = req.query
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const task = await Task.findById(id)
                if (!task) {
                    return res.status(404).json({ success: false, message: 'Task not found' })
                }
                res.status(200).json({ success: true, data: task })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'PUT':
            try {
                const task = await Task.findByIdAndUpdate(id, req.body, { new: true })
                if (!task) {
                    return res.status(404).json({ success: false, message: 'Task not found' })
                }
                res.status(200).json({ success: true, data: task })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'DELETE':
            try {
                const task = await Task.findByIdAndDelete(id)
                if (!task) {
                    return res.status(404).json({ success: false, message: 'Task not found' })
                }
                res.status(200).json({ success: true, data: {} })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        default:
            res.status(405).json({ success: false, message: 'Method not allowed' })
            break
    }
}