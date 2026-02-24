// pages/api/admin/products/index.js
import dbConnect from '@/lib/dbConnect'
import Product from '@/models/Product'

export default async function handler(req, res) {
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const products = await Product.find({}).sort({ order: 1 })
                res.status(200).json({ success: true, data: products })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'POST':
            try {
                // Находим максимальный order и увеличиваем на 1
                const lastProduct = await Product.findOne({}).sort({ order: -1 })
                const order = lastProduct ? lastProduct.order + 1 : 0

                const product = await Product.create({
                    ...req.body,
                    order,
                    stats: {
                        claims: 0,
                        completedClaims: 0,
                        cancelledClaims: 0
                    }
                });
                res.status(201).json({ success: true, data: product })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        default:
            res.status(405).json({ success: false, message: 'Method not allowed' })
            break
    }
}

// pages/api/admin/products/[id].js
export default async function handler(req, res) {
    const { id } = req.query
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const product = await Product.findById(id)
                if (!product) {
                    return res.status(404).json({ success: false, message: 'Product not found' })
                }
                res.status(200).json({ success: true, data: product })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'PUT':
            try {
                const product = await Product.findByIdAndUpdate(id, req.body, { new: true })
                if (!product) {
                    return res.status(404).json({ success: false, message: 'Product not found' })
                }
                res.status(200).json({ success: true, data: product })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'DELETE':
            try {
                const product = await Product.findByIdAndDelete(id)
                if (!product) {
                    return res.status(404).json({ success: false, message: 'Product not found' })
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

// pages/api/admin/products/reorder.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' })
    }

    await dbConnect()

    try {
        const { orderedIds } = req.body

        // Обновляем порядок для каждого продукта
        for (let i = 0; i < orderedIds.length; i++) {
            await Product.findByIdAndUpdate(orderedIds[i], { order: i })
        }

        const products = await Product.find({}).sort({ order: 1 })
        res.status(200).json({ success: true, data: products })
    } catch (error) {
        res.status(400).json({ success: false, error: error.message })
    }
}

// pages/api/admin/products/claims.js
export default async function handler(req, res) {
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const claims = await Product.aggregate([
                    { $unwind: '$claims' },
                    { $match: { 'claims.status': 'pending' }},
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'claims.userId',
                            foreignField: 'telegramId',
                            as: 'user'
                        }
                    },
                    { $unwind: '$user' },
                    {
                        $project: {
                            productId: '$_id',
                            productName: '$name',
                            claimId: '$claims._id',
                            claimedAt: '$claims.claimedAt',
                            status: '$claims.status',
                            userId: '$user.telegramId',
                            userName: { $concat: ['$user.first_name', ' ', '$user.last_name'] }
                        }
                    }
                ])

                res.status(200).json({ success: true, data: claims })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'PUT':
            try {
                const { productId, claimId, status } = req.body

                const product = await Product.findOneAndUpdate(
                    {
                        _id: productId,
                        'claims._id': claimId
                    },
                    {
                        $set: { 'claims.$.status': status }
                    },
                    { new: true }
                )

                if (!product) {
                    return res.status(404).json({ success: false, message: 'Claim not found' })
                }

                res.status(200).json({ success: true, data: product })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        default:
            res.status(405).json({ success: false, message: 'Method not allowed' })
            break
    }
}