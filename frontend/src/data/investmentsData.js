// src/data/investmentsData.js
export const investmentsData = {
    // Категория "Финансы"
    finances: {
        title: 'Финансы',
        type: 'linear',
        items: [
            {
                id: 'debt',
                name: 'Деньги в долг',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.2,
                costMultiplier: 1.5,
                image: '/assets/images/growth/1.png'
            },
            {
                id: 'bank',
                name: 'Банковский вклад',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.2,
                costMultiplier: 1.5,
                image: '/assets/images/growth/2.png'
            },
            {
                id: 'russian_stocks',
                name: 'Акции российских компаний',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.25,
                costMultiplier: 1.5,
                image: '/assets/images/growth/3.png'
            },
            {
                id: 'global_stocks',
                name: 'Акции международных компаний',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.25,
                costMultiplier: 1.5,
                image: '/assets/images/growth/4.png'
            },
            {
                id: 'ipo',
                name: 'IPO',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.3,
                costMultiplier: 1.6,
                image: '/assets/images/growth/5.png'
            },
            {
                id: 'bonds',
                name: 'Облигации',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.15,
                costMultiplier: 1.4,
                image: '/assets/images/growth/6.png'
            },
            {
                id: 'mutual_funds',
                name: 'Паевые фонды',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.2,
                costMultiplier: 1.5,
                image: '/assets/images/growth/7.png'
            },
            {
                id: 'trust_management',
                name: 'Доверительное управление',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.25,
                costMultiplier: 1.5,
                image: '/assets/images/growth/8.png'
            },
            {
                id: 'exchange_fund',
                name: 'Биржевой фонд',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.22,
                costMultiplier: 1.5,
                image: '/assets/images/growth/9.png'
            },
            {
                id: 'swiss_deposit',
                name: 'Швейцарский вклад',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.28,
                costMultiplier: 1.6,
                image: '/assets/images/growth/10.png'
            }
        ]
    },

    // Категория "Технологии"
    technology: {
        title: 'Технологии',
        type: 'exponential',
        items: [
            {
                id: 'blog',
                name: 'Блог',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.25,
                costMultiplier: 1.5,
                image: '/assets/images/growth/11.png'
            },
            {
                id: 'telegram_channel',
                name: 'Telegram-канал',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.3,
                costMultiplier: 1.55,
                image: '/assets/images/growth/12.png'
            },
            {
                id: 'youtube_channel',
                name: 'YouTube-каналы',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.35,
                costMultiplier: 1.6,
                image: '/assets/images/growth/13.png'
            },
            {
                id: 'online_course',
                name: 'Онлайн-курс',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.4,
                costMultiplier: 1.65,
                image: '/assets/images/growth/14.png'
            },
            {
                id: 'ad_spots',
                name: 'Рекламные места',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.3,
                costMultiplier: 1.55,
                image: '/assets/images/growth/15.png'
            },
            {
                id: 'revenue_sites',
                name: 'Доходные сайты',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.32,
                costMultiplier: 1.58,
                image: '/assets/images/growth/16.png'
            },
            {
                id: 'crypto_miner',
                name: 'Майнинг криптовалют',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.45,
                costMultiplier: 1.7,
                image: '/assets/images/growth/17.png'
            },
            {
                id: 'algo_trading',
                name: 'Алгоритмический трейдинг',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.4,
                costMultiplier: 1.6,
                image: '/assets/images/growth/18.png'
            },
            {
                id: 'crypto_arbitrage',
                name: 'Арбитраж крипты',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.38,
                costMultiplier: 1.65,
                image: '/assets/images/growth/19.png'
            },
            {
                id: 'software_sales',
                name: 'Продажа софта',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.36,
                costMultiplier: 1.62,
                image: '/assets/images/growth/20.png'
            }
        ]
    },

    // Категория "Бизнес"
    business: {
        title: 'Бизнес',
        type: 'parabolic',
        items: [
            {
                id: 'vending_machine',
                name: 'Вендинговый аппарат',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.2,
                bonus_percent: 0.05,
                costMultiplier: 1.5,
                image: '/assets/images/growth/21.png'
            },
            {
                id: 'car_rental',
                name: 'Авто в аренду',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.25,
                bonus_percent: 0.06,
                costMultiplier: 1.55,
                image: '/assets/images/growth/22.png'
            },
            {
                id: 'coffee_shop',
                name: 'Кофейня',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.3,
                bonus_percent: 0.07,
                costMultiplier: 1.6,
                image: '/assets/images/growth/23.png'
            },
            {
                id: 'meat_shop',
                name: 'Мясной магазин',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.27,
                bonus_percent: 0.065,
                costMultiplier: 1.57,
                image: '/assets/images/growth/24.png'
            },
            {
                id: 'restaurant',
                name: 'Ресторан',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.35,
                bonus_percent: 0.08,
                costMultiplier: 1.65,
                image: '/assets/images/growth/25.png'
            },
            {
                id: 'car_dealership',
                name: 'Автосалон',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.4,
                bonus_percent: 0.09,
                costMultiplier: 1.7,
                image: '/assets/images/growth/26.png'
            },
            {
                id: 'hypermarket',
                name: 'Гипермаркет',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.45,
                bonus_percent: 0.1,
                costMultiplier: 1.75,
                image: '/assets/images/growth/27.png'
            },
            {
                id: 'stadium',
                name: 'Стадион',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.5,
                bonus_percent: 0.12,
                costMultiplier: 1.8,
                image: '/assets/images/growth/28.png'
            },
            {
                id: 'airport',
                name: 'Аэропорт',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.6,
                bonus_percent: 0.15,
                costMultiplier: 2.0,
                image: '/assets/images/growth/29.png'
            },
            {
                id: 'seaport',
                name: 'Порт',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.55,
                bonus_percent: 0.14,
                costMultiplier: 1.9,
                image: '/assets/images/growth/30.png'
            }
        ]
    },

    // Категория "Недвижимость"
    realestate: {
        title: 'Недвижимость',
        type: 'inverse_parabolic',
        items: [
            {
                id: 'garage',
                name: 'Гараж',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.15,
                costMultiplier: 1.4,
                image: '/assets/images/growth/31.png'
            },
            {
                id: 'basement',
                name: 'Подвал',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.12,
                costMultiplier: 1.35,
                image: '/assets/images/growth/32.png'
            },
            {
                id: 'parking_spot',
                name: 'Машино-место',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.13,
                costMultiplier: 1.38,
                image: '/assets/images/growth/33.png'
            },
            {
                id: 'studio',
                name: 'Студия',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.18,
                costMultiplier: 1.45,
                image: '/assets/images/growth/34.png'
            },
            {
                id: 'apartment',
                name: 'Девушка',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.2,
                costMultiplier: 1.5,
                image: '/assets/images/growth/35.png'
            },
            {
                id: 'hostel',
                name: 'Хостел в Москве',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.25,
                costMultiplier: 1.55,
                image: '/assets/images/growth/36.png'
            },
            {
                id: 'elite_house',
                name: 'Элитный загородный дом',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.35,
                costMultiplier: 1.65,
                image: '/assets/images/growth/37.png'
            },
            {
                id: 'dubai_hotel',
                name: 'Отель в Дубае',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.4,
                costMultiplier: 1.7,
                image: '/assets/images/growth/38.png'
            },
            {
                id: 'dubai_mall',
                name: 'Торговый центр в Дубае',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.45,
                costMultiplier: 1.75,
                image: '/assets/images/growth/39.png'
            },
            {
                id: 'maldives_island',
                name: 'Курортный остров на Мальдивах',
                baseIncome: 1610,
                level: 1,
                cost: 2000,
                multiplier: 1.5,
                costMultiplier: 1.8,
                image: '/assets/images/growth/40.png'
            }
        ]
    }
};