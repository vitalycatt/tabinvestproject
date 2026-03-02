<!-- src/components/game/Balance.vue -->
<template>
  <div class="balance" ref="balanceContainer">
    <img src="../../assets/images/coin.png" class="balance__icon" alt="coin" />
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
  if (!container || !textEl) return;

  overrideFontSize.value = null;
  await nextTick();

  const availableWidth = container.clientWidth;
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

const formattedBalance = computed(() => {
  const value = Math.floor(store.balance);
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
