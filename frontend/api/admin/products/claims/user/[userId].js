// pages/api/products/claims/user/[userId].js
import dbConnect from '@/lib/dbConnect'
import ProductClaim from '@/models/ProductClaim'

export default async function handler(req, res) {
    const { userId } = req.query

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' })
    }

    await dbConnect()

    if (req.method === 'GET') {
        try {
            // Получаем все заявки пользователя
            const claims = await ProductClaim.find({ userId })
                .select('productId status createdAt')

            return res.status(200).json({
                success: true,
                data: claims
            })
        } catch (error) {
            console.error('Error fetching user claims:', error)
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch user claims'
            })
        }
    } else {
        return res.status(405).json({ success: false, message: 'Method not allowed' })
    }
}