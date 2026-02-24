<!-- src/components/game/ProductClaimModal.vue -->
<template>
  <div class="modal-backdrop" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div class="title">{{ customStrings.title || 'Оформление продукта' }}</div>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="product-details">
          <img :src="product.image" :alt="product.name" class="product-image"/>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <div class="required-income">
              <span>{{ customStrings.requiredIncome || 'Необходимый доход:' }} </span>
              <strong>{{ formatMoney(product.requiredIncome) }}</strong>
            </div>
          </div>
        </div>

        <div class="product-description">
          <p>{{ product.description }}</p>
        </div>

        <div v-if="product.claimInstructions" class="claim-instructions">
          <h4>{{ customStrings.instructions || 'Инструкции по получению:' }}</h4>
          <p>{{ product.claimInstructions }}</p>
        </div>

        <div class="user-info">
          <div class="user-fields">
            <div class="form-group">
              <label>{{ customStrings.name || 'Имя' }}</label>
              <div class="user-value">{{ userName }}</div>
            </div>

            <div class="form-group">
              <label>{{ customStrings.telegram || 'Telegram' }}</label>
              <div class="user-value">{{ userTelegram }}</div>
            </div>

            <div class="form-group">
              <label>{{ customStrings.passiveIncome || 'Пассивный доход' }}</label>
              <div class="user-value">{{ formatMoney(passiveIncome) }} / {{ customStrings.month || 'месяц' }}</div>
            </div>
          </div>

          <div class="disclaimer">
            <p>{{ customStrings.disclaimer || 'Нажимая кнопку "Оформить", вы соглашаетесь с тем, что ваши данные будут переданы для дальнейшей обработки заявки.' }}</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="secondary-button" @click="$emit('close')">{{ customStrings.cancel || 'Отмена' }}</button>
        <button class="primary-button" @click="$emit('claim')">{{ customStrings.submit || 'Оформить' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue';
import { useTelegram } from '@/composables/useTelegram';
import { useGameStore } from '@/stores/gameStore';
import { GameSettingsService } from '@/services/GameSettingsService';

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'claim']);
const { user } = useTelegram();
const store = useGameStore();
const logger = inject('logger', console);

// Настраиваемые строки для модального окна
const customStrings = ref({
  title: 'Оформление продукта',
  requiredIncome: 'Необходимый доход:',
  instructions: 'Инструкции по получению:',
  name: 'Имя',
  telegram: 'Telegram',
  passiveIncome: 'Пассивный доход',
  month: 'месяц',
  disclaimer: 'Нажимая кнопку "Оформить", вы соглашаетесь с тем, что ваши данные будут переданы для дальнейшей обработки заявки.',
  cancel: 'Отмена',
  submit: 'Оформить'
});

// Настройка форматирования денег
const moneyFormat = ref({
  thousand: 'K',
  million: 'M',
  billion: 'B'
});

// Загрузка настроек при монтировании
onMounted(async () => {
  try {
    // Загрузка кастомных строк для модального окна
    const customModalStrings = await GameSettingsService.getSetting('products.modalStrings', null);
    if (customModalStrings && typeof customModalStrings === 'object') {
      customStrings.value = {
        ...customStrings.value,
        ...customModalStrings
      };
      logger.log('Загружены кастомные строки для модального окна продуктов:', customModalStrings);
    }

    // Загрузка настроек форматирования денег
    const customMoneyFormat = await GameSettingsService.getSetting('balance.customSuffixes', null);
    if (customMoneyFormat && typeof customMoneyFormat === 'object') {
      moneyFormat.value = {
        ...moneyFormat.value,
        ...customMoneyFormat
      };
      logger.log('Загружены настройки форматирования денег:', customMoneyFormat);
    }
  } catch (error) {
    logger.error('Ошибка загрузки настроек для модального окна продуктов:', error);
  }
});

// Форматированные данные пользователя
const userName = computed(() => {
  if (!user.value) return 'Неизвестный игрок';
  return `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim();
});

const userTelegram = computed(() => {
  if (!user.value) return 'Неизвестный';
  return user.value.username ? `@${user.value.username}` : `ID: ${user.value.id}`;
});

const passiveIncome = computed(() => {
  return store.passiveIncome;
});

// Форматирование чисел с учетом настроек
const formatMoney = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + moneyFormat.value.billion;
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + moneyFormat.value.million;
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + moneyFormat.value.thousand;
  }
  return num.toString();
};

// Обработка нажатия Escape
const handleEscape = (e) => {
  if (e.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
  document.body.style.overflow = 'hidden';
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(180deg, #2a163b 0%, #1c0d28 100%);
  border-radius: 24px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.title {
  font-size: 18px;
  font-weight: 700;
}

.close-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-body {
  padding: 16px;
}

.product-details {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: center;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
}

.product-info {
  flex: 1;
}

.product-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
}

.required-income {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.product-description {
  margin-bottom: 16px;
  line-height: 1.5;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.claim-instructions {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.claim-instructions h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.claim-instructions p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.user-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
}

.user-fields {
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.user-value {
  font-size: 14px;
  font-weight: 500;
}

.disclaimer {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
}

.disclaimer p {
  margin: 0;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.primary-button, .secondary-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.primary-button {
  background: var(--primary-color, #8C60E3);
  color: white;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.primary-button:hover {
  background: #7550c8;
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.primary-button:active, .secondary-button:active {
  transform: translateY(1px);
}
</style>