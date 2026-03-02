<!-- src/components/admin/modals/InvestmentModal.vue -->
<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>
          {{ investment ? "Редактировать инвестицию" : "Создать инвестицию" }}
        </h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="investment-form">
        <div class="form-group">
          <label for="name">Название</label>
          <input
            type="text"
            id="name"
            v-model="form.name"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="description">Описание</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="form-input"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">Категория</label>
            <select
              id="category"
              v-model="form.category"
              required
              class="form-input"
            >
              <option value="finances">Финансы</option>
              <option value="technology">Технологии</option>
              <option value="business">Бизнес</option>
              <option value="realestate">Недвижимость</option>
            </select>
          </div>

          <div class="form-group">
            <label for="type">Тип дохода</label>
            <select id="type" v-model="form.type" required class="form-input">
              <option value="linear">Линейный</option>
              <option value="parabolic">Параболический</option>
              <option value="exponential">Экспоненциальный</option>
              <option value="inverse_parabolic">Обратно-параболический</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="baseIncome">Базовый доход</label>
            <input
              type="number"
              id="baseIncome"
              v-model.number="form.baseIncome"
              required
              min="0"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="cost">Стоимость</label>
            <input
              type="number"
              id="cost"
              v-model.number="form.cost"
              required
              min="0"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="level">Начальный уровень</label>
            <input
              type="number"
              id="level"
              v-model.number="form.level"
              required
              min="1"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="multiplier">Множитель</label>
            <input
              type="number"
              id="multiplier"
              v-model.number="form.multiplier"
              required
              min="1"
              step="0.1"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group" v-if="form.type === 'parabolic'">
          <label for="bonus_percent">Бонусный процент</label>
          <input
            type="number"
            id="bonus_percent"
            v-model.number="form.bonus_percent"
            min="0"
            max="1"
            step="0.01"
            class="form-input"
          />
          <small>От 0 до 1, например 0.25 для 25%</small>
        </div>

        <div class="form-group">
          <label for="image">Изображение</label>
          <div class="image-upload">
            <div class="file-input-wrapper">
              <input
                type="file"
                id="image"
                ref="fileInput"
                @change="handleFileChange"
                accept="image/*"
                class="file-input"
              />
              <div class="file-input-button">
                <span>Выбрать файл</span>
              </div>
              <div class="file-name" v-if="selectedFile">
                {{ selectedFile.name }}
              </div>
              <div class="file-name" v-else-if="form.image">
                Текущее изображение
              </div>
              <div class="file-name empty" v-else>Файл не выбран</div>
            </div>
            <div class="or-separator">ИЛИ</div>
            <input
              type="text"
              id="image-url"
              v-model="form.image"
              class="form-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div class="image-preview" v-if="imagePreview || form.image">
            <img
              :src="imagePreview || getFullImagePath(form.image)"
              alt="Preview"
              @error="handleImageError"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.active" />
            Активна
          </label>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">
            Отмена
          </button>
          <button type="submit" class="btn-primary">
            {{ investment ? "Сохранить" : "Создать" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ApiService } from "../../../services/apiService";

const ALLOWED_FIELDS = [
  "name",
  "description",
  "category",
  "type",
  "baseIncome",
  "cost",
  "level",
  "multiplier",
  "bonus_percent",
  "active",
  "image",
  "order",
];

const props = defineProps({
  investment: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "save"]);

const form = ref({
  name: "",
  description: "",
  category: "finances",
  type: "linear",
  baseIncome: 0,
  cost: 0,
  level: 1,
  multiplier: 1.2,
  image: "",
  bonus_percent: 0,
  active: true,
});

const selectedFile = ref(null);
const fileInput = ref(null);
const imagePreview = ref(null);

onMounted(() => {
  if (props.investment) {
    const cleaned = {};
    for (const key of ALLOWED_FIELDS) {
      if (props.investment[key] !== undefined) {
        cleaned[key] = props.investment[key];
      }
    }
    form.value = { ...form.value, ...cleaned };
  }
});

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    form.value.image = "";

    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const getFullImagePath = (imagePath) => {
  if (
    imagePath &&
    (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
  ) {
    return imagePath;
  }
  return imagePath ? `${ApiService.API_URL}${imagePath}` : "";
};

const handleImageError = (e) => {
  console.error("Ошибка загрузки изображения:", form.value.image);
  e.target.src =
    "https://www.shutterstock.com/image-vector/default-ui-image-placeholder-wireframes-600nw-1037719192.jpg";
};

const getFilteredFormData = () => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (form.value[key] !== undefined) {
      data[key] = form.value[key];
    }
  }
  return data;
};

const handleSubmit = () => {
  if (selectedFile.value) {
    const formData = new FormData();
    const filtered = getFilteredFormData();

    for (const key in filtered) {
      if (key !== "image") {
        formData.append(key, filtered[key]);
      }
    }

    formData.append("investmentImage", selectedFile.value);
    emit("save", formData, true);
  } else {
    emit("save", getFilteredFormData(), false);
  }
};
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

.investment-form {
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

.btn-remove-image {
  display: block;
  width: 100%;
  padding: 6px;
  margin-top: 6px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-remove-image:hover {
  background: #d32f2f;
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
  background: var(--primary-color, #8c60e3);
  color: white;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

small {
  font-size: 12px;
  color: #666;
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
