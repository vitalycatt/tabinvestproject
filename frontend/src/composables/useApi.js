// Добавить в composables/useApi.js если такой файл у вас есть,
// или создать новый

export const useApi = () => {
  const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE || "https://tabinvestproject.ru");
  const API_URL = `${API_BASE}/api`;

  // Получение рефералов для указанного пользователя
  const getReferrals = async (userId) => {
    try {
      console.log("Запрос рефералов для пользователя:", userId);
      const response = await fetch(`${API_URL}/referrals?userId=${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP ошибка: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Ошибка при получении рефералов:", error);
      throw error;
    }
  };

  // Обновление статуса реферала (для отметки получения награды)
  const updateReferral = async (referralId, data) => {
    try {
      const response = await fetch(`${API_URL}/referrals/${referralId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ошибка: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Ошибка при обновлении реферала:", error);
      throw error;
    }
  };

  return {
    getReferrals,
    updateReferral,
    // Здесь могут быть другие API методы
  };
};
