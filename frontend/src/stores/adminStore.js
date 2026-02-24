// src/stores/adminStore.js
import {defineStore} from "pinia";
import {ApiService} from "@/services/apiService";

export const useAdminStore = defineStore("admin", {
    state: () => {
        return {
            users: [],
            tasks: [],
            products: [],
            notifications: [],
            stats: {
                totalUsers: 0,
                activeUsers: 0,
                newUsers: 0,
                totalProducts: 0,
                activeProducts: 0,
                totalClaims: 0,
                pendingClaims: 0,
                totalTasks: 0,
                activeTasks: 0,
                completedTasks: 0,
                totalNotifications: 0,
                totalSentNotifications: 0,
                totalReadNotifications: 0,
            },
            gameSettings: {
                tapValue: 1,
                baseEnergy: 100,
                incomeMultiplier: 1,
                expMultiplier: 1,
                boosts: {
                    tap3xCost: 8000,
                    tap5xCost: 25000,
                    duration: 86400000, // 24 часа в миллисекундах
                },
                investments: {
                    baseReturn: 1.5,
                    levelMultiplier: 1.2,
                },
                levelRequirements: [{level: 1, income: 0, title: "Новичок"}],
            },
            loading: {
                users: false,
                tasks: false,
                products: false,
                notifications: false,
                stats: false,
            },
            error: null,
        };
    },

    getters: {
        // Пользователи
        usersByLevel: (state) => {
            return [...state.users].sort((a, b) => (b.level || 0) - (a.level || 0));
        },
        usersByIncome: (state) => {
            return [...state.users].sort(
                (a, b) => (b.passiveIncome || 0) - (a.passiveIncome || 0),
            );
        },
        activeProducts: (state) => {
            return state.products.filter((p) => p.active);
        },
        activeTasks: (state) => {
            return state.tasks.filter((t) => t.active);
        },
    },

    actions: {
        // Общие действия
        setLoading(section, isLoading) {
            this.loading[section] = isLoading;
        },
        clearError() {
            this.error = null;
        },
        setError(error) {
            this.error = error;
        },

        // Аутентификация
        async login(username, password) {
            try {
                const result = await ApiService.login(username, password);
                if (result.token) {
                    localStorage.setItem("token", result.token);
                }
                return result.success;
            } catch (error) {
                this.setError(error.message);
                return false;
            }
        },

        async logout() {
            localStorage.removeItem("isAdmin");
        },

        // Управление пользователями
        async fetchUsers() {
            this.setLoading("users", true);
            try {
                const response = await ApiService.getAllUsers();
                this.users = response.users || [];

                // Обновляем статистику, если доступна
                if (response.stats) {
                    this.stats.totalUsers = response.stats.total;
                    this.stats.activeUsers = response.stats.activeToday;
                    this.stats.newUsers = response.stats.newThisWeek;
                }

                return this.users;
            } catch (error) {
                this.setError(error.message);
                console.error("Error fetching users:", error);
                return [];
            } finally {
                this.setLoading("users", false);
            }
        },

        async blockUser(userId) {
            try {
                await ApiService.blockUser(userId);
                await this.fetchUsers();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error blocking user:", error);
                return false;
            }
        },

        async resetUserProgress(userId) {
            try {
                await ApiService.resetUserProgress(userId);
                await this.fetchUsers();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error resetting user progress:", error);
                return false;
            }
        },

        // Управление заданиями
        async fetchTasks() {
            this.setLoading("tasks", true);
            try {
                const response = await ApiService.getTasks();
                this.tasks = response || [];

                // Обновляем статистику
                this.stats.totalTasks = this.tasks.length;
                this.stats.activeTasks = this.tasks.filter((t) => t.active).length;
                this.stats.completedTasks = this.tasks.reduce(
                    (sum, task) => sum + (task.completions || 0),
                    0,
                );

                return this.tasks;
            } catch (error) {
                this.setError(error.message);
                console.error("Error fetching tasks:", error);
                return [];
            } finally {
                this.setLoading("tasks", false);
            }
        },

        async createTask(taskData) {
            try {
                await ApiService.createTask(taskData);
                await this.fetchTasks();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error creating task:", error);
                return false;
            }
        },

        async updateTask(taskId, taskData) {
            try {
                await ApiService.updateTask(taskId, taskData);
                await this.fetchTasks();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error updating task:", error);
                return false;
            }
        },

        async deleteTask(taskId) {
            try {
                await ApiService.deleteTask(taskId);
                await this.fetchTasks();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error deleting task:", error);
                return false;
            }
        },

        // Управление продуктами
        async fetchProducts() {
            this.setLoading("products", true);
            try {
                const response = await ApiService.getProducts();
                this.products = response || [];

                // Обновляем статистику
                this.stats.totalProducts = this.products.length;
                this.stats.activeProducts = this.products.filter(
                    (p) => p.active,
                ).length;
                this.stats.totalClaims = this.products.reduce(
                    (sum, product) => sum + (product.stats?.claims || 0),
                    0,
                );
                this.stats.pendingClaims = this.products.reduce((sum, product) => {
                    // Предполагаем, что количество pending claims это общее количество минус выполненные и отмененные
                    const pendingCount =
                        (product.stats?.claims || 0) -
                        (product.stats?.completedClaims || 0) -
                        (product.stats?.cancelledClaims || 0);
                    return sum + Math.max(0, pendingCount);
                }, 0);

                return this.products;
            } catch (error) {
                this.setError(error.message);
                console.error("Error fetching products:", error);
                return [];
            } finally {
                this.setLoading("products", false);
            }
        },

        async createProduct(productData) {
            try {
                await ApiService.createProduct(productData);
                await this.fetchProducts();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error creating product:", error);
                return false;
            }
        },

        async updateProduct(productId, productData) {
            try {
                await ApiService.updateProduct(productId, productData);
                await this.fetchProducts();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error updating product:", error);
                return false;
            }
        },

        async deleteProduct(productId) {
            try {
                await ApiService.deleteProduct(productId);
                await this.fetchProducts();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error deleting product:", error);
                return false;
            }
        },

        // Управление уведомлениями
        async fetchNotifications() {
            this.setLoading("notifications", true);
            try {
                const response = await ApiService.getNotificationsHistory();
                this.notifications = response || [];

                // Получаем статистику уведомлений
                const notificationStats = await ApiService.getNotificationStats();

                // Обновляем статистику
                this.stats.totalNotifications = this.notifications.length;
                this.stats.totalSentNotifications = notificationStats?.totalSent || 0;
                this.stats.totalReadNotifications = notificationStats?.totalRead || 0;
                this.stats.avgReadRate = notificationStats?.avgReadRate || 0;

                return this.notifications;
            } catch (error) {
                this.setError(error.message);
                console.error("Error fetching notifications:", error);
                return [];
            } finally {
                this.setLoading("notifications", false);
            }
        },

        async sendNotification(notificationData) {
            try {
                await ApiService.sendNotification(notificationData);
                await this.fetchNotifications();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error sending notification:", error);
                return false;
            }
        },

        async deleteNotification(notificationId) {
            try {
                await ApiService.deleteNotification(notificationId);
                await this.fetchNotifications();
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error deleting notification:", error);
                return false;
            }
        },

        // Управление игровыми настройками
        async fetchGameSettings() {
            try {
                const settings = await ApiService.getGameSettings();
                if (settings) {
                    this.gameSettings = settings;
                }
                return this.gameSettings;
            } catch (error) {
                this.setError(error.message);
                console.error("Error fetching game settings:", error);
                return this.gameSettings;
            }
        },

        async updateGameSettings(settings) {
            try {
                await ApiService.updateGameSettings(settings);
                this.gameSettings = settings;
                return true;
            } catch (error) {
                this.setError(error.message);
                console.error("Error updating game settings:", error);
                return false;
            }
        },

        // Загрузка общей статистики
        async fetchStats() {
            this.setLoading("stats", true);
            try {
                const stats = await ApiService.getStats();
                if (stats) {
                    // Обновляем существующую статистику новыми данными
                    this.stats = {...this.stats, ...stats};
                }
                return this.stats;
            } catch (error) {
                this.setError(error.message);
                console.error("Error fetching stats:", error);
                return this.stats;
            } finally {
                this.setLoading("stats", false);
            }
        },

        // Загрузка всех данных для инициализации админки
        async initializeAdmin() {
            try {
                // Загружаем данные параллельно
                await Promise.all([
                    this.fetchUsers(),
                    this.fetchTasks(),
                    this.fetchProducts(),
                    this.fetchNotifications(),
                    this.fetchGameSettings(),
                    this.fetchStats(),
                ]);
                return true;
            } catch (error) {
                this.setError("Ошибка инициализации: " + error.message);
                console.error("Error initializing admin:", error);
                return false;
            }
        },
    },
});
