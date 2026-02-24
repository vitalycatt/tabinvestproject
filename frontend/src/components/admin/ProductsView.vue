<!-- src/views/admin/ProductsView.vue -->
<template>
  <div class="admin-view">
    <AdminLayout>
      <template #content>
        <ProductsManagement />
      </template>
    </AdminLayout>
  </div>
</template>

<script setup>
import AdminLayout from '@/components/admin/AdminLayout.vue';
import ProductsManagement from '@/components/admin/ProductsManagement.vue';
</script>