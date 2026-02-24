// src/composables/useTelegram.js
import { ref, onMounted } from 'vue';

export function useTelegram() {
    const tg = ref(null);
    const user = ref(null);
    const initData = ref(null);
    const isAvailable = ref(false);
    const error = ref(null);
    const colorScheme = ref('light');

    const init = () => {
        try {
            // Проверяем доступность Telegram WebApp
            if (window.Telegram && window.Telegram.WebApp) {
                tg.value = window.Telegram.WebApp;
                isAvailable.value = true;

                // Получаем данные инициализации
                if (tg.value.initDataUnsafe) {
                    initData.value = tg.value.initDataUnsafe;

                    // Получаем данные пользователя, если они доступны
                    if (tg.value.initDataUnsafe.user) {
                        user.value = tg.value.initDataUnsafe.user;
                    }
                }

                // Получаем цветовую схему
                if (tg.value.colorScheme) {
                    colorScheme.value = tg.value.colorScheme;
                }

                // Безопасная работа с методами WebApp
                try {
                    // Проверяем доступность методов перед их использованием
                    // Журналы показывают, что некоторые методы не поддерживаются в текущей версии

                    // Безопасное использование BackButton
                    if (tg.value.BackButton && typeof tg.value.BackButton.hide === 'function') {
                        tg.value.BackButton.hide();
                    }

                    // Не используем методы, которые вызывают ошибки в версии 6.0
                    // if (typeof tg.value.setBackgroundColor === 'function') tg.value.setBackgroundColor('#ffffff');
                    // if (typeof tg.value.setHeaderColor === 'function') tg.value.setHeaderColor('#ffffff');
                } catch (e) {
                    console.warn('Some Telegram WebApp methods are not supported:', e);
                }
            } else {
                console.warn('Telegram WebApp not available. Running in browser mode.');
            }
        } catch (e) {
            console.error('Error initializing Telegram WebApp:', e);
            error.value = e;
        }
    };

    // Безопасные обертки для методов Telegram WebApp

    const showBackButton = () => {
        if (isAvailable.value && tg.value.BackButton && typeof tg.value.BackButton.show === 'function') {
            tg.value.BackButton.show();
        }
    };

    const hideBackButton = () => {
        if (isAvailable.value && tg.value.BackButton && typeof tg.value.BackButton.hide === 'function') {
            tg.value.BackButton.hide();
        }
    };

    const onBackButtonClicked = (callback) => {
        if (isAvailable.value && tg.value.BackButton && typeof tg.value.BackButton.onClick === 'function') {
            tg.value.BackButton.onClick(callback);
        }
    };

    const showConfirm = (message, callback) => {
        if (isAvailable.value && typeof tg.value.showConfirm === 'function') {
            return tg.value.showConfirm(message, callback);
        }
        return window.confirm(message); // Fallback для браузера
    };

    const showAlert = (message, callback) => {
        if (isAvailable.value && typeof tg.value.showAlert === 'function') {
            return tg.value.showAlert(message, callback);
        }
        alert(message); // Fallback для браузера
        if (callback) callback();
    };

    const closeApp = () => {
        if (isAvailable.value && typeof tg.value.close === 'function') {
            tg.value.close();
        }
    };

    const expandApp = () => {
        if (isAvailable.value && typeof tg.value.expand === 'function') {
            tg.value.expand();
        }
    };

    // Инициализируем при монтировании
    onMounted(() => {
        init();
    });

    return {
        tg,
        user,
        initData,
        isAvailable,
        error,
        colorScheme,
        showBackButton,
        hideBackButton,
        onBackButtonClicked,
        showConfirm,
        showAlert,
        closeApp,
        expandApp
    };
}