import { createRouter, createWebHistory } from 'vue-router'

import CourseDescriptionComponent from '@/modules/components/CourseDescriptionComponent.vue'
import CourseGradesComponent from '@/modules/components/CourseGradesComponent.vue'
import CourseForumComponent from '@/modules/components/CourseForumComponent.vue'
import CourseMeetingComponent from '@/modules/components/CourseMeetingComponent.vue'
import CourseReportsComponent from '@/modules/components/CourseReportsComponent.vue'

const routes = [
  { path: '/', name: 'home', component: () => import('../modules/pages/HomePage.vue') },
  { path: '/login', name: 'login', component: () => import('../modules/pages/LoginPage.vue') },
  {
    path: '/registrarse',
    name: 'register',
    component: () => import('../modules/pages/RegisterPage.vue'),
  },
  {
    path: '/verificarEmail',
    name: 'verify-email',
    component: () => import('../modules/pages/VerifyEmailPage.vue'),
  },
  {
    path: '/cambiarContrasenia',
    name: 'change-password',
    component: () => import('../modules/pages/ResetPaswordPage.vue'),
  },
  {
    path: '/curso/:id',
    component: () => import('../modules/pages/CoursePage.vue'),
    children: [
      { path: '', redirect: { name: 'course-principal' } },
      { path: 'principal', name: 'course-principal', component: CourseDescriptionComponent },
      { path: 'calificaciones', name: 'course-grades', component: CourseGradesComponent },
      { path: 'foro', name: 'course-forum', component: CourseForumComponent },
      { path: 'reunion', name: 'course-meeting', component: CourseMeetingComponent },
      { path: 'reportes', name: 'course-reports', component: CourseReportsComponent },
    ],
  },
  {
    path: '/misCursos',
    name: 'my-courses',
    component: () => import('../modules/pages/MyCoursesPage.vue'),
  },
  { path: '/perfil', name: 'profile', component: () => import('../modules/pages/ProfilePage.vue') },
  { path: '/admin', name: 'admin', component: () => import('../modules/pages/AdminPage.vue') },
  {
    path: '/superAdmin',
    name: 'super-admin',
    component: () => import('../modules/pages/SuperAdminPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../modules/pages/NotFoundPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
