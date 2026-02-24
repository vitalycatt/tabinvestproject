<!-- src/components/admin/modals/TaskModal.vue -->
<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ task ? 'Редактировать задание' : 'Создать задание' }}</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="task-form">
        <div class="form-group">
          <label for="title">Название</label>
          <input
              type="text"
              id="title"
              v-model="form.title"
              required
              class="form-input"
          >
        </div>

        <div class="form-group">
          <label for="description">Описание</label>
          <textarea
              id="description"
              v-model="form.description"
              required
              rows="3"
              class="form-input"
          ></textarea>
        </div>

        <!-- Новое поле для ссылки -->
        <div class="form-group">
          <label for="link">Ссылка на задание</label>
          <input
              type="url"
              id="link"
              v-model="form.link"
              class="form-input"
              placeholder="https://example.com/ref=123"
          >
          <div class="field-hint">Ссылка для перехода при нажатии на задание (например, реферальная)</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="type">Тип задания</label>
            <select
                id="type"
                v-model="form.type"
                required
                class="form-input"
            >
              <option value="daily">Ежедневное</option>
              <option value="achievement">Достижение</option>
              <option value="special">Специальное</option>
              <option value="platform">Платформа</option>
            </select>
          </div>

          <div class="form-group">
            <label for="reward">Награда</label>
            <input
                type="number"
                id="reward"
                v-model.number="form.reward"
                required
                min="1"
                class="form-input"
            >
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="minLevel">Минимальный уровень</label>
            <input
                type="number"
                id="minLevel"
                v-model.number="form.requirements.level"
                min="1"
                class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="minIncome">Минимальный доход</label>
            <input
                type="number"
                id="minIncome"
                v-model.number="form.requirements.income"
                min="0"
                class="form-input"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="taskImage">Иконка</label>
          <div class="image-upload">
            <div class="file-input-wrapper">
              <input
                  type="file"
                  id="taskImage"
                  ref="fileInput"
                  @change="handleFileChange"
                  accept="image/*"
                  class="file-input"
              >
              <div class="file-input-button">
                <span>Выбрать файл</span>
              </div>
              <div class="file-name" v-if="selectedFile">
                {{ selectedFile.name }}
              </div>
              <div class="file-name" v-else-if="form.icon">
                Текущее изображение
              </div>
              <div class="file-name empty" v-else>
                Файл не выбран
              </div>
            </div>
            <div class="or-separator">ИЛИ</div>
            <input
                type="text"
                id="icon"
                v-model="form.icon"
                class="form-input"
                placeholder="URL иконки или название файла"
            >
          </div>
          <div class="image-preview" v-if="imagePreview || form.icon">
            <img
                :src="imagePreview || getFullImagePath(form.icon)"
                alt="Preview"
                @error="handleImageError"
            >
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
                type="checkbox"
                v-model="form.active"
            >
            Активно
          </label>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">
            Отмена
          </button>
          <button type="submit" class="btn-primary">
            {{ task ? 'Сохранить' : 'Создать' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ApiService } from '../../../services/apiService';

const props = defineProps({
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  title: '',
  description: '',
  type: 'daily',
  reward: 100,
  link: '', // Добавлено новое поле для ссылки
  requirements: {
    level: 1,
    income: 0
  },
  icon: '',
  active: true
})

const selectedFile = ref(null)
const fileInput = ref(null)
const imagePreview = ref(null)

onMounted(() => {
  if (props.task) {
    // Если редактируем существующее задание
    form.value = {
      ...props.task,
      link: props.task.link || '', // Добавляем поле link с дефолтным значением
      requirements: {
        level: props.task.requirements?.level || 1,
        income: props.task.requirements?.income || 0
      }
    }
  }
})

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file

    // Очищаем URL изображения, если выбран файл
    form.value.icon = '' // Важно очистить текущую иконку

    // Создаем превью изображения
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Функция для получения полного пути к изображению
const getFullImagePath = (iconPath) => {
  if (!iconPath) return '';

  // Если путь уже начинается с http/https, оставляем как есть
  if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
    return iconPath;
  }

  // Обрабатываем случай с поврежденным путем
  let cleanPath = iconPath;
  if (iconPath.includes('file:/')) {
    // Извлекаем только часть пути с /uploads/...
    const match = iconPath.match(/\/uploads\/[^"]+/);
    if (match) {
      cleanPath = match[0];
    }
  }

  // Добавляем базовый URL сервера
  return `${ApiService.API_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

// Функция для обработки ошибок загрузки изображений
const handleImageError = (e) => {
  console.error('Ошибка загрузки изображения:', form.value.icon);
  // Заменяем на изображение-заглушку
  e.target.src = 'https://www.shutterstock.com/image-vector/default-ui-image-placeholder-wireframes-600nw-1037719192.jpg';
};

const handleSubmit = () => {
  // Если выбран файл, сообщаем родителю, что нужно использовать FormData
  if (selectedFile.value) {

    console.log("Selected file info:", {
      name: selectedFile.value.name,
      type: selectedFile.value.type,
      size: selectedFile.value.size
    });

    const formData = new FormData()

    // Добавляем основные данные задания
    formData.append('title', form.value.title)
    formData.append('description', form.value.description)
    formData.append('type', form.value.type)
    formData.append('reward', form.value.reward)
    formData.append('active', form.value.active)
    formData.append('link', form.value.link) // Добавляем поле ссылки в FormData

    // Добавляем требования как JSON строку
    formData.append('requirements', JSON.stringify({
      level: form.value.requirements.level,
      income: form.value.requirements.income
    }))

    // Добавляем файл изображения
    formData.append('taskImage', selectedFile.value)

    emit('save', formData, true) // Второй параметр указывает, что это FormData
  } else {
    // Если файл не выбран, отправляем обычный объект
    emit('save', { ...form.value }, false)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.image-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.file-input-button {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
}

.file-name {
  margin-left: 10px;
  font-size: 14px;
  color: #333;
}

.file-name.empty {
  color: #999;
}

.or-separator {
  text-align: center;
  margin: 10px 0;
  font-size: 12px;
  color: #666;
}

.image-preview {
  width: 100%;
  max-height: 100px;
  overflow: hidden;
  border-radius: 4px;
  margin-top: 8px;
  border: 1px solid #ddd;
  text-align: center;
}

.image-preview img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: var(--primary-color, #8C60E3);
  color: white;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

/* Стиль для текста подсказки */
.field-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    padding: 15px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>