<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isLanding = computed(() => route.path === '/')
const mobileMenuOpen = ref(false)

const activeMenu = computed(() => {
  if (route.path.startsWith('/national-map')) return '/national-map'
  if (route.path.startsWith('/regional-industry')) return '/regional-industry'
  if (route.path.startsWith('/legislation')) return '/legislation'
  if (route.path.startsWith('/case-studies')) return '/case-studies'
  if (route.path.startsWith('/my-analysis')) return '/my-analysis'
  if (route.path === '/about') return '/about'
  return '/regional-industry'
})

function handleMenuSelect(path) {
  if (path !== route.path) router.push(path)
}

function handleMobileMenuSelect(path) {
  handleMenuSelect(path)
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="app-shell">
    <header v-if="!isLanding" class="site-header">
      <div class="site-header__inner">
        <router-link to="/" class="brand">
          <span class="brand-mark">RI</span>
          <span class="brand-copy">
            <strong>지역산업 인사이트</strong>
            <small>공개자료 기반 지역산업 정보</small>
          </span>
        </router-link>

        <el-button class="mobile-menu-trigger" plain @click="mobileMenuOpen = true">
          <span aria-hidden="true">☰</span>
          메뉴
        </el-button>

        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          :ellipsis="false"
          class="site-nav"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/regional-industry">지역산업 분석</el-menu-item>
          <el-menu-item index="/national-map">전국 지도</el-menu-item>
          <el-menu-item index="/legislation">법안·입법예고</el-menu-item>
          <el-menu-item index="/case-studies">케이스 스터디</el-menu-item>
          <el-menu-item index="/my-analysis">내 분석</el-menu-item>
        </el-menu>
      </div>
    </header>

    <el-drawer v-model="mobileMenuOpen" direction="ltr" size="280px" class="mobile-nav-drawer">
      <template #header>
        <router-link to="/" class="drawer-brand" @click="mobileMenuOpen = false">
          <span class="brand-mark">RI</span>
          <strong>지역산업 인사이트</strong>
        </router-link>
      </template>
      <p class="drawer-description">어디를 확인할지 선택하세요.</p>
      <el-menu :default-active="activeMenu" class="drawer-menu" @select="handleMobileMenuSelect">
        <el-menu-item index="/regional-industry">지역산업 분석</el-menu-item>
        <el-menu-item index="/national-map">전국 지도</el-menu-item>
        <el-menu-item index="/legislation">법안·입법예고</el-menu-item>
        <el-menu-item index="/case-studies">케이스 스터디</el-menu-item>
        <el-menu-item index="/my-analysis">내 분석</el-menu-item>
      </el-menu>
    </el-drawer>

    <main class="app-content" :class="{ 'app-content--landing': isLanding }">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f5f7fb;
  color: #172033;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #e5eaf2;
  background: rgb(255 255 255 / 92%);
  backdrop-filter: blur(14px);
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: 1240px;
  min-height: 72px;
  margin: 0 auto;
  padding: 0 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding: 0;
  color: #172033;
}

.brand:hover {
  background: transparent;
}

.brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 11px;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #0f766e);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.brand-copy {
  display: grid;
  gap: 1px;
}

.brand-copy strong {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.brand-copy small {
  color: #8490a5;
  font-size: 0.68rem;
  letter-spacing: -0.02em;
}

.site-nav {
  border-bottom: 0;
  background: transparent;
}

.mobile-menu-trigger {
  display: none;
  font-weight: 700;
}

.mobile-menu-trigger span {
  margin-right: 3px;
  font-size: 1rem;
}

.drawer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #172033;
}

.drawer-brand strong {
  font-size: 1rem;
  font-weight: 800;
}

.drawer-description {
  margin: 0 0 18px;
  color: #7b8799;
  font-size: 0.82rem;
}

.drawer-menu {
  border-right: 0;
}

:deep(.drawer-menu .el-menu-item) {
  height: 48px;
  margin-bottom: 4px;
  border-radius: 10px;
  color: #526176;
  font-weight: 700;
}

:deep(.drawer-menu .el-menu-item.is-active) {
  color: #2563eb;
  background: #eff6ff;
}

:deep(.site-nav .el-menu-item) {
  height: 72px;
  color: #68748a;
  font-weight: 700;
}

:deep(.site-nav .el-menu-item:hover) {
  color: #2563eb;
  background: #f1f5ff;
}

:deep(.site-nav .el-menu-item.is-active) {
  color: #2563eb;
}

.app-content {
  min-height: calc(100vh - 72px);
}

.app-content--landing {
  min-height: 100vh;
}

@media (max-width: 680px) {
  .site-header__inner {
    align-items: center;
    display: flex;
    justify-content: space-between;
    max-width: none;
    min-height: 64px;
    padding: 0 18px;
  }

  .brand-copy small {
    display: none;
  }

  .site-nav {
    display: none;
  }

  .mobile-menu-trigger {
    display: inline-flex;
  }
}
</style>
