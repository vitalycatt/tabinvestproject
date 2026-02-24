// models/GameSettings.js
import mongoose from 'mongoose'

const GameSettingsSchema = new mongoose.Schema({
    tapValue: {
        type: Number,
        default: 1
    },
    baseEnergy: {
        type: Number,
        default: 100
    },
    energyRegenRate: {
        type: Number,
        default: 1
    },
    incomeMultiplier: {
        type: Number,
        default: 1
    },
    expMultiplier: {
        type: Number,
        default: 1
    },
    levelRequirements: [{
        level: Number,
        income: Number,
        title: String
    }],
    // Настройки бустов
    boosts: {
        tap3xCost: {
            type: Number,
            default: 8000
        },
        tap5xCost: {
            type: Number,
            default: 25000
        },
        duration: {
            type: Number,
            default: 86400000 // 24 часа в миллисекундах
        }
    },
    // Базовые настройки инвестиций
    investments: {
        baseReturn: {
            type: Number,
            default: 1.5
        },
        levelMultiplier: {
            type: Number,
            default: 1.2
        }
    }
}, {
    timestamps: true
})

export default mongoose.models.GameSettings || mongoose.model('GameSettings', GameSettingsSchema)