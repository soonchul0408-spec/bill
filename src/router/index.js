import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
    },
    {
      path: '/regional-industry',
      name: 'regional-industry',
      component: () => import('../views/RegionalIndustryView.vue'),
    },
    {
      path: '/regional-industry/:id',
      name: 'regional-industry-detail',
      component: () => import('../views/RegionalIndustryDetailView.vue'),
    },
    {
      path: '/regional-case-studies',
      name: 'regional-case-studies',
      component: () => import('../views/RegionalCaseStudyView.vue'),
    },
    {
      path: '/national-map',
      name: 'national-map',
      component: () => import('../views/NationalMapView.vue'),
    },
    {
      path: '/national-map/:regionId',
      name: 'national-region-detail',
      component: () => import('../views/NationalRegionDetailView.vue'),
    },
    {
      path: '/legislation',
      name: 'legislation',
      component: () => import('../views/LegislationView.vue'),
    },
    {
      path: '/case-studies',
      name: 'case-studies',
      component: () => import('../views/CaseStudyListView.vue'),
    },
    {
      path: '/case-studies/:id',
      name: 'case-study-detail',
      component: () => import('../views/CaseStudyView.vue'),
    },
    {
      path: '/my-analysis',
      name: 'my-analysis',
      component: () => import('../views/MyAnalysisView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
