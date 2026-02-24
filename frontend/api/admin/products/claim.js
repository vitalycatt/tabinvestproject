// pages/api/products/claim.js
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'
import ProductClaim from '@/models/ProductClaim'
import User from '@/models/User'

export default async function handler(req, res) {
    await dbConnect()

    if (req.method === 'POST') {
        try {
            const { userId, userData, productId } = req.body

            if (!userId || !productId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID and Product ID are required'
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

            // Проверяем существование продукта
            const product = await Product.findById(productId)
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                })
            }

            // Проверяем, имеет ли пользователь достаточный доход
            if (user.gameData.passiveIncome < product.requiredIncome) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient passive income'
                })
            }

            // Проверяем, не делал ли пользователь заявку ранее
            const existingClaim = await ProductClaim.findOne({
                userId,
                productId
            })

            if (existingClaim) {
                return res.status(400).json({
                    success: false,
                    message: 'User has already claimed this product'
                })
            }

            // Создаем новую заявку
            const claim = await ProductClaim.create({
                userId,
                userData,
                productId,
                status: 'pending'
            })

            // Обновляем статистику продукта
            await Product.findByIdAndUpdate(productId, {
                $inc: { 'stats.claims': 1 }
            })

            return res.status(201).json({
                success: true,
                data: claim
            })
        } catch (error) {
            console.error('Error creating product claim:', error)
            return res.status(500).json({
                success: false,
                error: 'Failed to create product claim'
            })
        }
    } else {
        return res.status(405).json({ success: false, message: 'Method not allowed' })
    }
}