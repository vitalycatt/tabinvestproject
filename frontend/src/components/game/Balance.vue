<!-- src/components/game/Balance.vue -->
<template>
  <div class="balance" ref="balanceContainer">
    <img
      src="../../assets/images/coin.png"
      ref="balanceIcon"
      class="balance__icon"
      alt="coin"
    />
    <span
      ref="balanceText"
      class="balance__amount"
      :class="{ 'balance__amount--increasing': isIncreasing }"
      :style="fontSizeStyle"
    >
      {{ formattedBalance }}
    </span>
  </div>
</template>

<script setup>
import {
  ref,
  inject,
  watch,
  computed,
  nextTick,
  onMounted,
  onUnmounted,
} from "vue";
import { useGameStore } from "@/stores/gameStore";
import { GameSettingsService } from "@/services/GameSettingsService";

const store = useGameStore();
const logger = inject("logger", console);
const isIncreasing = ref(false);
let previousBalance = store.balance;

const balanceContainer = ref(null);
const balanceText = ref(null);
const balanceIcon = ref(null);
const overrideFontSize = ref(null);

const MIN_FONT_SIZE = 14;

let resizeObserver = null;

const fontSizeStyle = computed(() => {
  if (overrideFontSize.value !== null) {
    return { fontSize: overrideFontSize.value + "px" };
  }
  return {};
});

const customFormatting = ref({
  useSpaces: true,
  animation: {
    duration: 100,
    enabled: true,
  },
});

const adjustFontSize = async () => {
  const container = balanceContainer.value;
  const textEl = balanceText.value;
  const iconEl = balanceIcon.value;
  if (!container || !textEl) return;

  // Для коротких чисел (до 9 цифр) всегда используем базовый размер шрифта
  if (digitsCount.value <= 9) {
    overrideFontSize.value = null;
    return;
  }

  overrideFontSize.value = null;
  await nextTick();

  // Ширина, доступная под текст: ширина контейнера минус иконка и отступы
  let availableWidth = container.clientWidth;
  if (iconEl) {
    // ширина иконки + отступ между иконкой и числом (margin-left: 12px) + небольшой запас
    const reserved =
      iconEl.offsetWidth + 12 /* margin-left */ + 8 /* safety padding */;
    availableWidth = Math.max(0, availableWidth - reserved);
  }

  const textWidth = textEl.scrollWidth;

  if (textWidth > availableWidth) {
    const currentSize = parseFloat(getComputedStyle(textEl).fontSize);
    const ratio = availableWidth / textWidth;
    overrideFontSize.value = Math.max(
      MIN_FONT_SIZE,
      Math.floor(currentSize * ratio)
    );
  }
};

onMounted(async () => {
  try {
    const formatting = await GameSettingsService.getSetting(
      "balance.formatting",
      null
    );
    if (formatting && typeof formatting === "object") {
      customFormatting.value = {
        ...customFormatting.value,
        ...formatting,
      };
      logger.log("Загружены настройки форматирования баланса:", formatting);
    }

    previousBalance = store.balance;
  } catch (error) {
    logger.error("Ошибка загрузки настроек баланса:", error);
  }

  await nextTick();
  adjustFontSize();

  if (balanceContainer.value) {
    resizeObserver = new ResizeObserver(() => adjustFontSize());
    resizeObserver.observe(balanceContainer.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
});

const rawValue = computed(() => {
  const n = Math.floor(store.balance);
  return Number.isFinite(n) ? n : 0;
});

const digitsCount = computed(() => {
  return rawValue.value.toString().replace(/\D/g, "").length;
});

const formattedBalance = computed(() => {
  const value = rawValue.value;

  // До 9 цифр показываем число как есть, без форматирования
  if (digitsCount.value <= 9) {
    return value.toString();
  }

  // Для длинных чисел (> 9 цифр) включаем форматирование (например, пробелы)
  if (customFormatting.value.useSpaces) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
  return value.toString();
});

watch(formattedBalance, () => adjustFontSize());

watch(
  () => store.balance,
  (newBalance) => {
    if (!customFormatting.value.animation.enabled) {
      previousBalance = newBalance;
      return;
    }

    if (newBalance > previousBalance) {
      isIncreasing.value = true;
      setTimeout(() => {
        isIncreasing.value = false;
      }, customFormatting.value.animation.duration);
    }
    previousBalance = newBalance;
  },
  { immediate: true }
);
</script>

<style scoped>
.balance {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 19px auto;
  max-width: 100%;
  min-width: 0;
  padding: 0 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.balance__icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.balance__amount {
  margin-left: 12px;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: white;
  transition: color 0.3s ease;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.balance__amount--increasing {
  color: #fff;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
