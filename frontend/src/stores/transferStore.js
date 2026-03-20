import { defineStore } from "pinia";
import { ApiService } from "@/services/apiService";

export const useTransferStore = defineStore("transfer", {
  state: () => ({
    // Текущий шаг: 'search' | 'amount' | 'confirm' | 'result'
    step: "search",
    // Текущая вкладка: 'send' | 'history'
    activeTab: "send",

    // Поиск получателя
    searchQuery: "",
    searchResult: null,
    searchLoading: false,
    searchError: null,

    // Выбранный получатель
    selectedRecipient: null,

    // Сумма перевода
    transferAmount: "",

    // Результат перевода
    transferResult: null,
    transferLoading: false,
    transferError: null,

    // История
    history: [],
    historyLoading: false,
    historyPage: 1,
    historyTotalPages: 1,
    historyTotal: 0,
  }),

  actions: {
    resetTransfer() {
      this.step = "search";
      this.searchQuery = "";
      this.searchResult = null;
      this.searchError = null;
      this.selectedRecipient = null;
      this.transferAmount = "";
      this.transferResult = null;
      this.transferLoading = false;
      this.transferError = null;
    },

    async searchUser(query) {
      if (!query || query.trim().length === 0) {
        this.searchResult = null;
        this.searchError = null;
        return;
      }

      this.searchLoading = true;
      this.searchError = null;
      this.searchResult = null;

      try {
        const response = await ApiService.searchTransferUser(query.trim());
        if (response.success && response.data) {
          this.searchResult = response.data;
        } else {
          this.searchError = response.message || "Пользователь не найден";
        }
      } catch (error) {
        this.searchError = error.message || "Пользователь не найден";
      } finally {
        this.searchLoading = false;
      }
    },

    selectRecipient(user) {
      this.selectedRecipient = user;
      this.step = "amount";
    },

    goToConfirm(amount) {
      this.transferAmount = amount;
      this.step = "confirm";
    },

    goBack() {
      if (this.step === "amount") {
        this.step = "search";
        this.selectedRecipient = null;
        this.transferAmount = "";
      } else if (this.step === "confirm") {
        this.step = "amount";
      } else if (this.step === "result") {
        this.resetTransfer();
      }
    },

    async sendTransfer(senderTelegramId) {
      this.transferLoading = true;
      this.transferError = null;

      try {
        const response = await ApiService.sendTransfer(
          senderTelegramId,
          this.selectedRecipient.telegramId,
          Number(this.transferAmount)
        );

        if (response.success) {
          this.transferResult = response.data;
          this.step = "result";
        } else {
          this.transferError = response.message || "Ошибка перевода";
        }
      } catch (error) {
        this.transferError = error.message || "Ошибка сети. Попробуйте снова";
      } finally {
        this.transferLoading = false;
      }
    },

    async loadHistory(telegramId, page = 1) {
      this.historyLoading = true;

      try {
        const response = await ApiService.getTransferHistory(
          telegramId,
          page,
          20
        );

        if (response.success && response.data) {
          if (page === 1) {
            this.history = response.data.items;
          } else {
            this.history = [...this.history, ...response.data.items];
          }
          this.historyPage = response.data.pagination.currentPage;
          this.historyTotalPages = response.data.pagination.totalPages;
          this.historyTotal = response.data.pagination.total;
        }
      } catch (error) {
        console.error("[transferStore] loadHistory error:", error);
      } finally {
        this.historyLoading = false;
      }
    },

    async loadMoreHistory(telegramId) {
      if (this.historyPage < this.historyTotalPages && !this.historyLoading) {
        await this.loadHistory(telegramId, this.historyPage + 1);
      }
    },
  },
});
