// api/admin/users/index.js
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export default async function handler(req, res) {
    await dbConnect();

    try {
        if (req.method === 'GET') {
            console.log('Getting all users'); // Добавим лог

            const users = await User.find({})
                .select('telegramId first_name last_name username gameData lastLogin registeredAt blocked');

            console.log('Found users:', users.length); // Добавим лог

            const formattedUsers = users.map(user => ({
                id: user.telegramId,
                name: `${user.first_name} ${user.last_name || ''}`.trim(),
                level: user.gameData?.level?.current || 1,
                passiveIncome: user.gameData?.passiveIncome || 0,
                balance: user.gameData?.balance || 0,
                lastLogin: user.lastLogin,
                registeredAt: user.registeredAt,
                blocked: user.blocked || false
            }));

            return res.status(200).json({
                success: true,
                data: {
                    users: formattedUsers
                }
            });
        }
    } catch (error) {
        console.error('Error getting users:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
