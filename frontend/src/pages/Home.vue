<!-- src/pages/Home.vue -->
<template>
  <div class="home">
    <Header />
    <Balance />
    <TapArea />
    <EnergyBar />
    <Navigation />
  </div>

</template>

<script setup>
import Header from '@/components/layout/Header.vue'
import Balance from '@/components/game/Balance.vue'
import TapArea from '@/components/game/TapArea.vue'
import EnergyBar from '@/components/game/EnergyBar.vue'
import Navigation from '@/components/layout/Navigation.vue'
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 100px 0  80px 0;
  display: flex;
  flex-direction: column;
}

</style>