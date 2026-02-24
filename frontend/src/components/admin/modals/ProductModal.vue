<!-- src/components/admin/modals/ProductModal.vue -->
<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ product ? 'Редактировать продукт' : 'Создать продукт' }}</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="product-form">
        <div class="form-group">
          <label for="name">Название</label>
          <input
              type="text"
              id="name"
              v-model="form.name"
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

        <div class="form-row">
          <div class="form-group">
            <label for="type">Тип продукта</label>
            <select
                id="type"
                v-model="form.type"
                required
                class="form-input"
            >
              <option value="physical">Физический товар</option>
              <option value="digital">Цифровой товар</option>
              <option value="service">Услуга</option>
            </select>
          </div>

          <div class="form-group">
            <label for="requiredIncome">Требуемый доход</label>
            <input
                type="number"
                id="requiredIncome"
                v-model.number="form.requiredIncome"
                required
                min="0"
                class="form-input"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="productImage">Изображение</label>
          <div class="image-upload">
            <div class="file-input-wrapper">
              <input
                  type="file"
                  id="productImage"
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
              <div class="file-name" v-else-if="form.image">
                Текущее изображение
              </div>
              <div class="file-name empty" v-else>
                Файл не выбран
              </div>
            </div>
            <div class="or-separator">ИЛИ</div>
            <input
                type="text"
                id="image"
                v-model="form.image"
                class="form-input"
                placeholder="https://example.com/image.jpg"
            >
          </div>
          <div class="image-preview" v-if="imagePreview || form.image">
            <img
                :src="imagePreview || getFullImagePath(form.image)"
                alt="Preview"
                @error="handleImageError"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="claimInstructions">Инструкции для получения</label>
          <textarea
              id="claimInstructions"
              v-model="form.claimInstructions"
              rows="3"
              class="form-input"
              placeholder="Опишите, как пользователь может получить продукт..."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="gradient">Градиент фона (CSS)</label>
          <input
              type="text"
              id="gradient"
              v-model="form.gradient"
              class="form-input"
              placeholder="linear-gradient(140.83deg, rgb(111, 95, 242) 0%, rgb(73, 51, 131) 100%)"
          >
          <div
              class="color-preview"
              :style="{ background: form.gradient || getDefaultGradient(0) }"
          ></div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
                type="checkbox"
                v-model="form.active"
            >
            Активен
          </label>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">
            Отмена
          </button>
          <button type="submit" class="btn-primary">
            {{ product ? 'Сохранить' : 'Создать' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ApiService } from '../../../services/apiService';

const props = defineProps({
  product: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  description: '',
  type: 'digital',
  requiredIncome: 0,
  image: '',
  claimInstructions: '',
  gradient: '',
  active: true
})

const selectedFile = ref(null)
const fileInput = ref(null)
const imagePreview = ref(null)

onMounted(() => {
  if (props.product) {
    form.value = { ...props.product }
  }
})

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file

    // Очищаем URL изображения, если выбран файл
    form.value.image = ''

    // Создаем превью изображения
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const getDefaultGradient = (index) => {
  const gradients = [
    'linear-gradient(140.83deg, rgb(111, 95, 242) 0%, rgb(73, 51, 131) 100%)',
    'linear-gradient(140.83deg, rgb(242, 95, 95) 0%, rgb(131, 51, 51) 100%)',
    'linear-gradient(140.83deg, rgb(95, 135, 242) 0%, rgb(51, 71, 131) 100%)',
    'linear-gradient(140.83deg, rgb(95, 242, 169) 0%, rgb(51, 131, 94) 100%)',
    'linear-gradient(140.83deg, rgb(242, 95, 156) 0%, rgb(131, 51, 87) 100%)',
    'linear-gradient(140.83deg, rgb(242, 162, 95) 0%, rgb(131, 90, 51) 100%)'
  ];

  const idx = typeof index === 'number' ? index % gradients.length : 0;
  return gradients[idx];
};

// Функция для получения полного пути к изображению
const getFullImagePath = (imagePath) => {
  // Если путь уже начинается с http/https, оставляем как есть
  if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
    return imagePath;
  }

  // В противном случае добавляем базовый URL сервера
  return imagePath ? `${ApiService.API_URL}${imagePath}` : '';
};

// Функция для обработки ошибок загрузки изображений
const handleImageError = (e) => {
  console.error('Ошибка загрузки изображения:', form.value.image);
  // Заменяем на изображение-заглушку
  e.target.src = 'https://www.shutterstock.com/image-vector/default-ui-image-placeholder-wireframes-600nw-1037719192.jpg';
};

const handleSubmit = () => {
  // Если выбран файл, сообщаем родителю, что нужно использовать FormData
  if (selectedFile.value) {
    const formData = new FormData()

    // Добавляем основные данные продукта
    formData.append('name', form.value.name)
    formData.append('description', form.value.description)
    formData.append('type', form.value.type)
    formData.append('requiredIncome', form.value.requiredIncome)
    formData.append('claimInstructions', form.value.claimInstructions || '')
    formData.append('gradient', form.value.gradient || '')
    formData.append('active', form.value.active)

    // Добавляем файл изображения
    formData.append('productImage', selectedFile.value)

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

.product-form {
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

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.image-preview {
  width: 100%;
  max-height: 200px;
  overflow: hidden;
  border-radius: 4px;
  margin-top: 8px;
  border: 1px solid #ddd;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.color-preview {
  width: 100%;
  height: 30px;
  border-radius: 4px;
  margin-top: 8px;
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