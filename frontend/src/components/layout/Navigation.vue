<!-- src/components/layout/Navigation.vue -->
<template>
  <nav class="menu">
    <router-link
        v-for="item in visibleMenuItems"
        :key="item.path"
        :to="item.path"
        class="menu-item"
        :class="{ active: currentRoute === item.path }"
    >
      <div class="icon" v-html="getItemIcon(item)"></div>
      <span>{{ item.name }}</span>
    </router-link>

    <!-- Кнопка для входа в админку
    <a
        v-if="showAdminLink"
        href="/admin"
        class="menu-item admin-link"
    >
      <div class="icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.354L4 8.354L12 12.354L20 8.354L12 4.354Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 12.354L12 16.354L20 12.354" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 16.354L12 20.354L20 16.354" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span>{{ customStrings.admin || 'Админка' }}</span>
    </a> -->
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import { GameSettingsService } from '@/services/GameSettingsService'
import { useGameStore } from '@/stores/gameStore'

const route = useRoute()
const store = useGameStore()
const logger = inject('logger', console)
const currentRoute = computed(() => route.path)

// Настраиваемые параметры
const customStrings = ref({
  home: 'Главная',
  growth: 'Развитие',
  friends: 'Друзья',
  tasks: 'Задания',
  products: 'Подарки',
  admin: 'Админка'
})

const customIcons = ref({})
const showAdminLink = ref(true)
const requiredLevels = ref({
  growth: 1,
  friends: 1,
  tasks: 1,
  products: 1
})

// Стандартный список пунктов меню
const defaultMenuItems = [
  { name: 'Главная', path: '/', icon: 'home' },
  { name: 'Развитие', path: '/growth', icon: 'growth' },
  { name: 'Друзья', path: '/friends', icon: 'friends' },
  { name: 'Задания', path: '/tasks', icon: 'tasks' },
  { name: 'Подарки', path: '/products', icon: 'products' }
]

// Загрузка настроек навигации
onMounted(async () => {
  try {
    // Загрузка настроек строк меню
    const navStrings = await GameSettingsService.getSetting('navigation.strings', null)
    if (navStrings && typeof navStrings === 'object') {
      customStrings.value = {
        ...customStrings.value,
        ...navStrings
      }
      logger.log('Загружены кастомные строки для навигации:', navStrings)
    }

    // Загрузка кастомных иконок
    const icons = await GameSettingsService.getSetting('navigation.icons', null)
    if (icons && typeof icons === 'object') {
      customIcons.value = icons
      logger.log('Загружены кастомные иконки для навигации:', icons)
    }

    // Загрузка настройки отображения админ-панели
    showAdminLink.value = await GameSettingsService.getSetting('navigation.showAdminLink', true)

    // Загрузка требований к уровням для пунктов меню
    const levels = await GameSettingsService.getSetting('navigation.requiredLevels', null)
    if (levels && typeof levels === 'object') {
      requiredLevels.value = {
        ...requiredLevels.value,
        ...levels
      }
      logger.log('Загружены требования к уровням для навигации:', levels)
    }
  } catch (error) {
    logger.error('Ошибка загрузки настроек навигации:', error)
  }
})

// Список пунктов меню с учетом ограничений по уровню
const visibleMenuItems = computed(() => {
  return defaultMenuItems.map(item => {
    // Обновляем имя пункта меню из настроек
    const key = item.path === '/' ? 'home' : item.path.substring(1)
    const name = customStrings.value[key] || item.name

    return {
      ...item,
      name
    }
  }).filter(item => {
    // Проверяем, доступен ли пункт меню для текущего уровня
    const path = item.path === '/' ? 'home' : item.path.substring(1)
    const requiredLevel = requiredLevels.value[path] || 1
    return store.level.current >= requiredLevel
  })
})

// Получение HTML иконки для пункта меню
const getItemIcon = (item) => {
  const iconKey = item.path === '/' ? 'home' : item.path.substring(1)

  // Если есть кастомная иконка в настройках, используем её
  if (customIcons.value[iconKey]) {
    return customIcons.value[iconKey]
  }

  // Стандартные иконки
  if (item.path === '/') {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4.41667 11.5652V23.003C4.41667 23.5552 4.86438 24 5.41667 24H8.53788C9.09016 24 9.53788 23.5523 9.53788 23V18.5514C9.53788 17.9991 9.98559 17.5514 10.5379 17.5514H14.25C14.8023 17.5514 15.25 17.9991 15.25 18.5514V23C15.25 23.5523 15.6977 24 16.25 24H19.125C19.6773 24 20.125 23.5523 20.125 23V11.5654C20.125 11.0131 20.5727 10.5654 21.125 10.5654H22.2501C23.184 10.5654 23.6082 9.39884 22.8924 8.79896L13.0172 0.522337C12.6541 0.218064 12.1316 0.206923 11.7597 0.500292L1.26214 8.78096C0.517268 9.36853 0.93366 10.5654 1.88238 10.5654H3.41667C3.96895 10.5654 4.41667 11.0129 4.41667 11.5652Z" fill="currentColor"/>
    </svg>`
  }

  if (item.path === '/growth') {
    return `<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M1.375 15.125C1.375 14.7603 1.51987 14.4106 1.77773 14.1527C2.03559 13.8949 2.38533 13.75 2.75 13.75H5.5C5.86467 13.75 6.21441 13.8949 6.47227 14.1527C6.73013 14.4106 6.875 14.7603 6.875 15.125V19.25C6.875 19.6147 6.73013 19.9644 6.47227 20.2223C6.21441 20.4801 5.86467 20.625 5.5 20.625H2.75C2.38533 20.625 2.03559 20.4801 1.77773 20.2223C1.51987 19.9644 1.375 19.6147 1.375 19.25V15.125ZM8.25 9.625C8.25 9.26033 8.39487 8.91059 8.65273 8.65273C8.91059 8.39487 9.26033 8.25 9.625 8.25H12.375C12.7397 8.25 13.0894 8.39487 13.3473 8.65273C13.6051 8.91059 13.75 9.26033 13.75 9.625V19.25C13.75 19.6147 13.6051 19.9644 13.3473 20.2223C13.0894 20.4801 12.7397 20.625 12.375 20.625H9.625C9.26033 20.625 8.91059 20.4801 8.65273 20.2223C8.39487 19.9644 8.25 19.6147 8.25 19.25V9.625ZM15.125 2.75C15.125 2.38533 15.2699 2.03559 15.5277 1.77773C15.7856 1.51987 16.1353 1.375 16.5 1.375H19.25C19.6147 1.375 19.9644 1.51987 20.2223 1.77773C20.4801 2.03559 20.625 2.38533 20.625 2.75V19.25C20.625 19.6147 20.4801 19.9644 20.2223 20.2223C19.9644 20.4801 19.6147 20.625 19.25 20.625H16.5C16.1353 20.625 15.7856 20.4801 15.5277 20.2223C15.2699 19.9644 15.125 19.6147 15.125 19.25V2.75Z" fill="currentColor"/>
    </svg>`
  }

  if (item.path === '/friends') {
    return `<svg width="32" height="22" viewBox="0 0 32 22" fill="none">
      <path d="M5.80219 10.0111C7.21024 10.0111 8.3517 8.86967 8.3517 7.46162C8.3517 6.05356 7.21024 4.91211 5.80219 4.91211C4.39414 4.91211 3.25269 6.05356 3.25269 7.46162C3.25269 8.86967 4.39414 10.0111 5.80219 10.0111Z" fill="currentColor"/>
      <path d="M9.20573 11.796C8.54412 12.2941 8.00739 12.9392 7.63793 13.6803C7.26846 14.4214 7.07639 15.2383 7.07689 16.0665V16.3851H1.65919C1.13654 16.3851 0.703125 15.9517 0.703125 15.4291V14.7917C0.703125 12.8541 2.27107 11.2861 4.2087 11.2861H7.39558C8.05845 11.2861 8.68308 11.4773 9.20573 11.796Z" fill="currentColor"/>
      <path d="M26.1982 10.0111C27.6062 10.0111 28.7477 8.86967 28.7477 7.46162C28.7477 6.05356 27.6062 4.91211 26.1982 4.91211C24.7901 4.91211 23.6487 6.05356 23.6487 7.46162C23.6487 8.86967 24.7901 10.0111 26.1982 10.0111Z" fill="currentColor"/>
      <path d="M31.2973 14.7917V15.4291C31.2973 15.9517 30.8639 16.3851 30.3412 16.3851H24.9235V16.0665C24.9235 14.32 24.0822 12.7648 22.7947 11.796C23.3173 11.4773 23.942 11.2861 24.6048 11.2861H27.7917C29.7293 11.2861 31.2973 12.8541 31.2973 14.7917Z" fill="currentColor"/>
      <path d="M16 10.6485C18.1121 10.6485 19.8243 8.93634 19.8243 6.82426C19.8243 4.71218 18.1121 3 16 3C13.888 3 12.1758 4.71218 12.1758 6.82426C12.1758 8.93634 13.888 10.6485 16 10.6485Z" fill="currentColor"/>
      <path d="M19.5057 12.5605H12.4946C11.5651 12.5612 10.6738 12.9308 10.0165 13.5881C9.35924 14.2453 8.98969 15.1366 8.98901 16.0661V17.9782C8.98901 18.506 9.41733 18.9343 9.94508 18.9343H22.0552C22.3088 18.9343 22.552 18.8336 22.7313 18.6543C22.9106 18.475 23.0113 18.2318 23.0113 17.9782V16.0661C23.0106 15.1366 22.6411 14.2453 21.9838 13.5881C21.3265 12.9308 20.4353 12.5612 19.5057 12.5605Z" fill="currentColor"/>
    </svg>`
  }

  if (item.path === '/tasks') {
    return `<svg width="26" height="22" viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.3">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.30097 17.7676C8.68038 17.29 8.31125 16.7188 8.31125 16.0574V12.5431C8.31517 12.5156 8.32142 12.4886 8.32991 12.4622C8.32022 12.4171 8.31399 12.3714 8.31125 12.3254C8.31125 10.0177 12.6902 8.81104 17.0193 8.81104C21.3485 8.81104 25.7274 10.0177 25.7274 12.3254C25.7247 12.3714 25.7185 12.4171 25.7088 12.4622C25.7173 12.4886 25.7235 12.5156 25.7274 12.5431V16.0574C25.7247 16.2973 25.6739 16.5341 25.5782 16.7541C25.5811 16.7559 25.5841 16.7577 25.587 16.7595C24.1614 18.7018 21.3471 20.0072 17.3304 20.0072C14.0565 20.0072 11.2124 19.14 9.30097 17.7676ZM17.6414 15.8273C19.11 15.8009 20.5708 15.6068 21.9954 15.2488V17.6871C20.5647 18.0842 19.0887 18.2954 17.604 18.3153C17.626 18.2597 17.6386 18.2009 17.6414 18.1411V15.8273ZM16.4347 18.3153C14.95 18.2954 13.474 18.0842 12.0433 17.6871V15.2488C13.4679 15.6068 14.9287 15.8009 16.3973 15.8273V18.1411C16.4001 18.2009 16.4127 18.2597 16.4347 18.3153ZM23.2083 14.8632C23.6553 14.6964 24.0828 14.4816 24.4834 14.2225V16.0574C24.4834 16.4182 24.0418 16.8411 23.2394 17.2206V15.0311C23.2351 14.9742 23.2247 14.9179 23.2083 14.8632ZM10.7993 17.2206C9.99689 16.8411 9.55526 16.4182 9.55526 16.0574V14.2225C9.95587 14.4816 10.3834 14.6964 10.8304 14.8632C10.814 14.9179 10.8036 14.9742 10.7993 15.0311V17.2206Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.85766 10.3045C1.85916 10.3006 1.86067 10.2967 1.8622 10.2928L1.89952 10.2368C1.03493 9.7081 0.5 9.04255 0.5 8.24638V4.73204C0.503926 4.70461 0.510169 4.67756 0.518661 4.65118C0.508976 4.60611 0.502738 4.56036 0.5 4.51434C0.5 2.20669 4.87893 1 9.2081 1C13.5373 1 17.9162 2.20669 17.9162 4.51434C17.9135 4.56036 17.9072 4.60611 17.8975 4.65118C17.906 4.67756 17.9123 4.70461 17.9162 4.73204V8.24638C17.9135 8.48624 17.8627 8.72311 17.7669 8.94303C18.0268 9.10351 18.2407 9.2666 18.4159 9.42894C16.4451 11.103 13.1949 12.1962 9.5191 12.1962C6.53128 12.1962 3.82461 11.4739 1.85766 10.3045ZM9.83011 8.01624C11.2987 7.98982 12.7596 7.79574 14.1842 7.43777V9.87604C12.7534 10.2732 11.2775 10.4843 9.79279 10.5043C9.81471 10.4487 9.82732 10.3898 9.83011 10.3301V8.01624ZM8.62341 10.5043C7.13872 10.4843 5.66278 10.2732 4.23204 9.87604V7.43777C5.65663 7.79574 7.11745 7.98982 8.58609 8.01624V10.3301C8.58889 10.3898 8.60149 10.4487 8.62341 10.5043ZM15.3971 7.05213C15.844 6.88533 16.2716 6.67052 16.6722 6.41146V8.24638C16.6722 8.60715 16.2306 9.03011 15.4282 9.40954V7.22007C15.4238 7.16314 15.4134 7.10684 15.3971 7.05213ZM2.98803 9.40954C2.18564 9.03011 1.74401 8.60715 1.74401 8.24638V6.41146C2.14462 6.67052 2.57216 6.88533 3.01913 7.05213C3.00278 7.10684 2.99235 7.16314 2.98803 7.22007V9.40954Z" fill="white"/>
      </g>
    </svg>`
  }

  if (item.path === '/products') {
    return `<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M18 3.5H4C3.17157 3.5 2.5 4.17157 2.5 5V17C2.5 17.8284 3.17157 18.5 4 18.5H18C18.8284 18.5 19.5 17.8284 19.5 17V5C19.5 4.17157 18.8284 3.5 18 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M11 3.5V18.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2.5 11H19.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M7.5 7.5C7.5 7.5 8.5 6.5 11 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14.5 15.5C14.5 15.5 15.5 14.5 18 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }

  // Если не найдена иконка, возвращаем пустую строку
  return '';
}
</script>

<style scoped>
.menu {
  width: 90%;
  height: 54px;
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-between;
  background: var(--menu-bg);
  padding: 5px;
  border-radius: 12px;
  z-index: 100;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
  border-radius: 10px;
  color: #666;
  text-decoration: none;
  transition: all 0.3s ease;
}

.menu-item.active {
  background: var(--primary-color);
  color: white;
}

.menu-item .icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-item span {
  font-size: 9px;
  font-weight: 500;
  margin-top: 5px;
}

.menu-item:hover {
  color: white;
}

.admin-link {
  color: #fff;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.admin-link:hover {
  opacity: 1;
}
</style>