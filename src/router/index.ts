import MQTTDemoChen from '@/components/MQTTDemoChen.vue'
import PageA from '@/components/PageA.vue'
import PageB from '@/components/PageB.vue'
import PageC from '@/components/PageC.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MQTTDemoChen,
    },
    {
      path: '/page-a',
      name: 'page-a',
      component: PageA,
    },
    {
      path: '/page-b',
      name: 'page-b',
      component: PageB,
    },
    {
      path: '/page-c',
      name: 'page-c',
      component: PageC,
    },
  ],
})

export default router
