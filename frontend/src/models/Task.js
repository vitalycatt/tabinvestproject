// models/Task.js
import mongoose from 'mongoose'

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    reward: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['daily', 'achievement', 'special', 'platform'],
        default: 'daily'
    },
    link: {
        type: String,
        default: '' // Добавляем поле ссылки для партнерских сайтов
    },
    requirements: {
        level: {
            type: Number,
            default: 1
        },
        income: {
            type: Number,
            default: 0
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    completions: {
        type: Number,
        default: 0
    },
    icon: {
        type: String,
        default: 'default.png'
    }
}, {
    timestamps: true
})

export default mongoose.models.Task || mongoose.model('Task', TaskSchema)