// api/tasks/user/[userId].js
import dbConnect from '../../../lib/dbConnect'
import UserTask from '../../../models/UserTask' // Модель для отслеживания выполненных заданий

export default async function handler(req, res) {
    const { userId } = req.query

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' })
    }

    await dbConnect()

    if (req.method === 'GET') {
        try {
            // Получаем все выполненные задания пользователя
            const userTasks = await UserTask.find({ userId })
                .select('taskId completedAt')

            return res.status(200).json({
                success: true,
                data: userTasks
            })
        } catch (error) {
            console.error('Error fetching user tasks:', error)
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch user tasks'
            })
        }
    } else {
        return res.status(405).json({ success: false, message: 'Method not allowed' })
    }
}

// api/tasks/complete.js
import dbConnect from '../../lib/dbConnect'
import Task from '../../models/Task'
import User from '../../models/User'
import UserTask from '../../models/UserTask' // Модель для отслеживания выполненных заданий

export default async function handler(req, res) {
    await dbConnect()

    if (req.method === 'POST') {
        try {
            const { userId, taskId } = req.body

            if (!userId || !taskId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID and Task ID are required'
                })
            }

            // Проверяем существование пользователя
            const user = await User.findOne({ telegramId: userId })
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                })
            }

            // Проверяем существование задания
            const task = await Task.findById(taskId)
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                })
            }

            // Проверяем, не выполнил ли пользователь задание ранее
            const existingCompletion = await UserTask.findOne({
                userId,
                taskId
            })

            if (existingCompletion) {
                return res.status(400).json({
                    success: false,
                    message: 'User has already completed this task'
                })
            }

            // Создаем запись о выполненном задании
            const userTask = await UserTask.create({
                userId,
                taskId,
                completedAt: new Date()
            })

            // Обновляем счетчик выполнений задания
            await Task.findByIdAndUpdate(taskId, {
                $inc: { completions: 1 }
            })

            // Начисляем награду пользователю
            await User.findOneAndUpdate(
                { telegramId: userId },
                { $inc: { 'gameData.balance': task.reward } }
            )

            return res.status(201).json({
                success: true,
                data: {
                    task,
                    reward: task.reward,
                    completedAt: userTask.completedAt
                }
            })
        } catch (error) {
            console.error('Error completing task:', error)
            return res.status(500).json({
                success: false,
                error: 'Failed to complete task'
            })
        }
    } else {
        return res.status(405).json({ success: false, message: 'Method not allowed' })
    }
}