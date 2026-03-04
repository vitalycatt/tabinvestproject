// routes/investmentRoutes.js - ПОЛНАЯ ВЕРСИЯ (независимо от среды)
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {uploadsPath} from '../config.js';
import User from "../models/User.js";
import Investment from "../models/Investment.js";

const router = express.Router();

// ===== НАСТРОЙКА CORS =====
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// ===== ФИКСИРОВАННАЯ НАСТРОЙКА MULTER ДЛЯ ИНВЕСТИЦИЙ =====

// Жёстко заданная директория загрузки

// Фильтр файлов — только изображения
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Разрешены только изображения!'), false);
    }
};

// Настройка хранилища multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Создаём папку, если не существует
        try {
            if (!fs.existsSync(uploadsPath)) {
                fs.mkdirSync(uploadsPath, {recursive: true});
                console.log(`→ [multer] Директория создана: ${uploadsPath}`);
            }
            cb(null, uploadsPath);
        } catch (err) {
            console.error(`❌ [multer] Ошибка при создании директории ${uploadsPath}:`, err);
            cb(err);
        }
    }, filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const filename = `investment-${uniqueSuffix}${ext}`;

        console.log(`→ [multer] Сгенерировано имя файла: ${filename}`);
        cb(null, filename);

        // Опционально: проверка, что файл действительно записан (для отладки)
        setTimeout(() => {
            const filePath = path.join(uploadsPath, filename);
            const exists = fs.existsSync(filePath);
            console.log(`→ [multer] Файл существует по пути ${filePath}: ${exists}`);
        }, 200);
    }
});

// Инициализация upload
const upload = multer({
    storage, fileFilter, limits: {
        fileSize: 5 * 1024 * 1024 // 5 МБ
    }
});


// Middleware для обработки ошибок загрузки файлов инвестиций
const handleInvestmentUploadErrors = (req, res, next) => {
    return upload.single('investmentImage')(req, res, (err) => {
        if (err) {
            console.error('Investment file upload error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false, error: 'Размер файла превышает допустимый лимит (5MB)'
                });
            }
            return res.status(400).json({
                success: false, error: err.message
            });
        }
        next();
    });
};

// ===== РОУТЫ ИНВЕСТИЦИЙ =====

// Получение всех инвестиций
router.get('/', async (req, res) => {
    try {
        // Динамический импорт модели
        const Investment = (await import('../models/Investment.js')).default;

        const investments = await Investment.find({}).sort({order: 1, category: 1});

        console.log(`📊 Found ${investments.length} investments`);
        res.json({success: true, data: investments});
    } catch (error) {
        console.error('❌ Error getting investments:', error);
        res.status(500).json({success: false, error: error.message});
    }
});

// Создание инвестиции с изображением
router.post('/upload', handleInvestmentUploadErrors, async (req, res) => {
    try {
        console.log('💰 Creating investment with image...');
        console.log('Received body:', req.body);
        console.log('Received file:', req.file ? req.file.filename : 'No file');

        // Динамический импорт модели
        const Investment = (await import('../models/Investment.js')).default;

        // Находим максимальный order и увеличиваем на 1
        const lastInvestment = await Investment.findOne({}).sort({order: -1});
        const order = lastInvestment ? lastInvestment.order + 1 : 0;

        const investmentData = {
            name: req.body.name,
            description: req.body.description || '',
            category: req.body.category || 'finances',
            type: req.body.type || 'linear',
            baseIncome: Number(req.body.baseIncome) || 0,
            cost: Number(req.body.cost) || 0,
            level: Number(req.body.level) || 1,
            multiplier: Number(req.body.multiplier) || 1.2,
            bonus_percent: Number(req.body.bonus_percent) || 0,
            active: req.body.active === 'true' || req.body.active === true,
            order
        };

        // Если есть файл, добавляем его путь
        if (req.file) {
            investmentData.image = `/uploads/${req.file.filename}`;
            console.log(`✅ Investment image saved: ${investmentData.image}`);
        } else if (req.body.image) {
            investmentData.image = req.body.image;
        }

        // Проверяем обязательные поля
        if (!investmentData.name || !investmentData.category) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${!investmentData.name ? 'name' : ''} ${!investmentData.category ? 'category' : ''}`
            });
        }

        // Создаем инвестицию
        const investment = await Investment.create(investmentData);
        console.log('✅ Investment created successfully:', investment._id);

        res.status(201).json({success: true, data: investment});
    } catch (error) {
        console.error('❌ Error creating investment with image:', error);
        res.status(400).json({success: false, error: error.message});
    }
});

// Обновление инвестиции с изображением
router.put('/:id/upload', handleInvestmentUploadErrors, async (req, res) => {
    try {
        const {id} = req.params;
        console.log(`💰 Updating investment ${id} with image...`);

        // Динамический импорт модели
        const Investment = (await import('../models/Investment.js')).default;

        const investmentData = {...req.body};

        // Преобразуем значения
        investmentData.baseIncome = Number(investmentData.baseIncome) || 0;
        investmentData.cost = Number(investmentData.cost) || 0;
        investmentData.level = Number(investmentData.level) || 1;
        investmentData.multiplier = Number(investmentData.multiplier) || 1.2;
        investmentData.bonus_percent = Number(investmentData.bonus_percent) || 0;
        investmentData.active = investmentData.active === 'true' || investmentData.active === true;

        // Находим существующую инвестицию
        const existingInvestment = await Investment.findById(id);
        if (!existingInvestment) {
            return res.status(404).json({success: false, message: 'Инвестиция не найдена'});
        }

        // Если загружено новое изображение
        if (req.file) {
            // Удаляем старое изображение
            if (existingInvestment.image && !existingInvestment.image.startsWith('http')) {
                const fileName = existingInvestment.image.split('/').pop();
                const oldFilePath = path.join(uploadsPath, fileName);

                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log(`🗑️ Deleted old investment image: ${oldFilePath}`);
                }
            }

            investmentData.image = `/uploads/${req.file.filename}`;
            console.log(`✅ Investment image updated: ${investmentData.image}`);
        }

        // Обновляем инвестицию
        const investment = await Investment.findByIdAndUpdate(id, investmentData, {new: true});
        console.log('✅ Investment updated successfully:', investment._id);

        res.json({success: true, data: investment});
    } catch (error) {
        console.error('❌ Error updating investment with image:', error);
        res.status(400).json({success: false, error: error.message});
    }
});

// Создание инвестиции без изображения
router.post('/', async (req, res) => {
    try {
        console.log('💰 Creating investment without image...');

        const Investment = (await import('../models/Investment.js')).default;

        const lastInvestment = await Investment.findOne({}).sort({order: -1});
        const order = lastInvestment ? lastInvestment.order + 1 : 0;

        const investment = await Investment.create({
            ...req.body, order
        });

        console.log('✅ Investment created successfully:', investment._id);
        res.status(201).json({success: true, data: investment});
    } catch (error) {
        console.error('❌ Error creating investment:', error);
        res.status(400).json({success: false, error: error.message});
    }
});

// Получение конкретной инвестиции
router.get('/:id', async (req, res) => {
    try {
        const Investment = (await import('../models/Investment.js')).default;
        const {id} = req.params;
        const investment = await Investment.findById(id);

        if (!investment) {
            return res.status(404).json({success: false, message: 'Инвестиция не найдена'});
        }

        res.json({success: true, data: investment});
    } catch (error) {
        console.error('❌ Error getting investment:', error);
        res.status(400).json({success: false, error: error.message});
    }
});

// Обновление инвестиции без изображения
router.put('/:id', async (req, res) => {
    try {
        console.log(`💰 Updating investment ${req.params.id} without image...`);

        const Investment = (await import('../models/Investment.js')).default;
        const {id} = req.params;
        const investment = await Investment.findByIdAndUpdate(id, req.body, {new: true});

        if (!investment) {
            return res.status(404).json({success: false, message: 'Инвестиция не найдена'});
        }

        console.log('✅ Investment updated successfully:', investment._id);
        res.json({success: true, data: investment});
    } catch (error) {
        console.error('❌ Error updating investment:', error);
        res.status(400).json({success: false, error: error.message});
    }
});

// Удаление инвестиции
router.delete('/:id', async (req, res) => {
    try {
        console.log(`💰 Deleting investment ${req.params.id}...`);

        const Investment = (await import('../models/Investment.js')).default;
        const {id} = req.params;

        const investment = await Investment.findById(id);
        if (!investment) {
            return res.status(404).json({success: false, message: 'Инвестиция не найдена'});
        }

        // Удаляем изображение если есть
        if (investment.image && !investment.image.startsWith('http')) {
            const fileName = investment.image.split('/').pop();
            const oldFilePath = path.join(uploadsPath, fileName);

            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
                console.log(`🗑️ Deleted investment image: ${oldFilePath}`);
            }
        }

        await Investment.findByIdAndDelete(id);
        console.log('✅ Investment deleted successfully:', id);
        res.json({success: true, data: {}});
    } catch (error) {
        console.error('❌ Error deleting investment:', error);
        res.status(400).json({success: false, error: error.message});
    }
});

// Изменение порядка инвестиций
router.post('/reorder', async (req, res) => {
    try {
        console.log('💰 Reordering investments...');

        const Investment = (await import('../models/Investment.js')).default;
        const {orderedIds} = req.body;

        for (let i = 0; i < orderedIds.length; i++) {
            await Investment.findByIdAndUpdate(orderedIds[i], {order: i});
        }

        const investments = await Investment.find({}).sort({order: 1});
        console.log('✅ Investments reordered successfully');
        res.json({success: true, data: investments});
    } catch (error) {
        console.error('❌ Error reordering investments:', error);
        res.status(400).json({success: false, error: error.message});
    }
});

// Константа: минуты в месяце (~30 дней) — для перевода дохода «в минуту» в «в месяц»
// baseIncome в карточке инвестиции задаётся в «доход в месяц»; calculateIncome возвращает месячное значение

// Получение инвестиций по категории
router.get('/category/:category/:telegramId', async (req, res) => {
    try {
        const {category, telegramId} = req.params


        const user = await User.findOne({telegramId})
        if (!user) {
            return res.status(404).json({message: 'User not found'})
        }

        const investments = await Investment.find({
            category, active: true
        }).sort({order: 1})

        const purchased = user.gameData.investments.purchased || []
        const userLevel = user.gameData?.level?.current ?? 1

        const enriched = investments.map(inv => {
            const existing = purchased.find(item => item.id === inv._id.toString())

            const level = existing ? existing.level : 0
            const income = existing ? existing.income : 0

            const nextLevel = level + 1

            const nextCost = calculateCost(inv, nextLevel)
            // calculateIncome возвращает доход в месяц (baseIncome трактуется как «в месяц»)
            const nextIncome = calculateIncome(inv, nextLevel, userLevel)

            return {
                ...inv.toObject(), userLevel: level, currentIncome: income, nextCost, nextIncome
            }
        })

        res.json({success: true, data: enriched})

    } catch (error) {
        console.error(error)
        res.status(500).json({message: 'Server error'})
    }
})

const findPurchasedInvestment = (userInvestments, category, id) => {
    if (!userInvestments || !Array.isArray(userInvestments.purchased)) {
        return null
    }

    return userInvestments.purchased.find(item => item.type === category && item._id === id)
}


const getInvestmentLevel = (userInvestments, id) => {
    const purchased = findPurchasedInvestment(userInvestments, userInvestments.category, id)

    if (purchased) {
        return purchased.level
    }

    // Иначе возвращаем начальный уровень
    return 1
}


// Возвращает месячный пассивный доход (baseIncome в карточке инвестиции — «доход в месяц» на базовом уровне)
const calculateIncome = (investment, level, userLevel) => {
    const baseIncome = investment.baseIncome
    const type = investment.type || 'linear'

    switch (type) {
        case 'linear':
            return baseIncome * Math.pow(investment.multiplier, level)

        case 'parabolic':
            return (
                baseIncome * Math.pow(investment.multiplier, level) +
                baseIncome * (investment.bonus_percent || 0) * userLevel
            )

        case 'exponential':
            return baseIncome *
                Math.pow(investment.multiplier, level * userLevel)

        case 'inverse_parabolic':
            const decay = 1 / (1 + (userLevel / 10))
            return baseIncome *
                Math.pow(investment.multiplier, level) *
                decay

        default:
            return baseIncome
    }
}


const calculateCost = (investment, level) => {
    // Базовая стоимость
    const baseCost = investment.cost || 0
    // Коэффициент роста цены
    const costMultiplier = investment.multiplier || 1.5

    // Рассчитываем стоимость: базовая стоимость * (множитель ^ (уровень - базовый уровень))
    const baseLevel = investment.level || 1
    const levelDifference = level - baseLevel

    if (levelDifference <= 0) {
        return baseCost
    }

    return Math.round(baseCost * Math.pow(costMultiplier, levelDifference))
}

router.post('/buy/:userId/:productId', async (req, res) => {
    try {
        const {userId, productId} = req.params

        const user = await User.findOne({telegramId: userId})
        if (!user) {
            return res.status(404).json({message: 'User not found'})
        }

        const investment = await Investment.findById(productId)
        if (!investment || !investment.active) {
            return res.status(404).json({message: 'Investment not found'})
        }

        if (!user.gameData.investments.purchased) {
            user.gameData.investments.purchased = []
        }

        const existing = user.gameData.investments.purchased
            .find(item => item.id === investment._id.toString())

        const currentLevel = existing ? existing.level : 0
        const newLevel = currentLevel + 1

        const cost = calculateCost(investment, newLevel)

        if (user.gameData.balance < cost) {
            return res.status(400).json({message: 'Not enough balance'})
        }

        // уровень игрока с fallback (иначе undefined → NaN в формулах)
        const userLevel = user.gameData?.level?.current ?? 1

        // считаем месячный доход от нового уровня (calculateIncome возвращает «в месяц»)
        const income = calculateIncome(investment, newLevel, userLevel)
        const previousIncome = existing ? Number(existing.income ?? 0) : 0

        const deltaIncomeMonth = income - previousIncome

        user.gameData.balance -= cost
        const newPassiveIncome = Number(user.gameData.passiveIncome || 0) + deltaIncomeMonth
        user.gameData.passiveIncome = Math.max(0, newPassiveIncome)

        if (user.gameData.passiveIncome > (user.gameData.stats?.maxPassiveIncome || 0)) {
            if (!user.gameData.stats) user.gameData.stats = {}
            user.gameData.stats.maxPassiveIncome = user.gameData.passiveIncome
        }

        if (existing) {
            existing.level = newLevel
            existing.income = income
            existing.purchaseDate = new Date()
        } else {
            user.gameData.investments.purchased.push({
                id: investment._id.toString(),
                level: newLevel,
                income,
                purchaseDate: new Date(),
                type: investment.category
            })
        }

        await user.save()

        // income уже месячный
        const incomeMonth = income

        return res.json({
            success: true,
            balance: user.gameData.balance,
            passiveIncome: user.gameData.passiveIncome,
            newLevel,
            income: incomeMonth,
            nextCost: calculateCost(investment, newLevel + 1)
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Server error'})
    }
})

export default router;
