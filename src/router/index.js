import { createRouter, createWebHistory } from 'vue-router'

import { getDefaultRouteByRole, normalizeRole, readAuth } from '@/modules/helpers/authSession'
import CourseDescriptionComponent from '@/modules/components/CourseDescriptionComponent.vue'
import CourseGradesComponent from '@/modules/components/CourseGradesComponent.vue'
import CourseForumComponent from '@/modules/components/CourseForumComponent.vue'
import CourseMeetingComponent from '@/modules/components/CourseMeetingComponent.vue'
import CourseReportsComponent from '@/modules/components/CourseReportsComponent.vue'

const routes = [
  { path: '/', name: 'home', component: () => import('../modules/pages/HomePage.vue') },
  {
    path: '/login',
    name: 'login',
    component: () => import('../modules/pages/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/registrarse',
    name: 'register',
    component: () => import('../modules/pages/RegisterPage.vue'),
    meta: { guestOnly: true },
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
      {
        path: 'calificaciones',
        name: 'course-grades',
        component: CourseGradesComponent,
        meta: { requiresAuth: true, roles: ['STUDENT', 'TUTOR'] },
      },
      {
        path: 'foro',
        name: 'course-forum',
        component: CourseForumComponent,
        meta: { requiresAuth: true, roles: ['STUDENT', 'TUTOR'] },
      },
      {
        path: 'reunion',
        name: 'course-meeting',
        component: CourseMeetingComponent,
        meta: { requiresAuth: true, roles: ['STUDENT', 'TUTOR'] },
      },
      {
        path: 'reportes',
        name: 'course-reports',
        component: CourseReportsComponent,
        meta: { requiresAuth: true, roles: ['TUTOR'] },
      },
    ],
  },
  {
    path: '/misCursos',
    name: 'my-courses',
    component: () => import('../modules/pages/MyCoursesPage.vue'),
    meta: { requiresAuth: true, roles: ['STUDENT', 'TUTOR'] },
  },
  {
    path: '/perfilTutor',
    name: 'tutor-profile',
    component: () => import('../modules/pages/TutorProfilePage.vue'),
    meta: { requiresAuth: true, roles: ['TUTOR'] },
  },
  {
    path: '/perfil',
    name: 'profile',
    component: () => import('../modules/pages/ProfilePage.vue'),
    meta: { requiresAuth: true, roles: ['STUDENT'] },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../modules/pages/AdminPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/superAdmin',
    name: 'super-admin',
    component: () => import('../modules/pages/SuperAdminPage.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN'] },
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

router.beforeEach((to) => {
  const auth = readAuth()
  const authenticated = auth?.isAuthenticated === true
  const currentRole = normalizeRole(auth?.role)

  if (to.meta?.guestOnly && authenticated) {
    return getDefaultRouteByRole(currentRole)
  }

  if (!to.meta?.requiresAuth) return true

  if (!authenticated) {
    return {
      name: 'login',
      query: {
        reason: 'auth-required',
        redirect: to.fullPath,
      },
    }
  }

  const allowedRoles = Array.isArray(to.meta?.roles) ? to.meta.roles.map(normalizeRole) : []

  if (allowedRoles.length === 0 || allowedRoles.includes(currentRole)) {
    return true
  }

  return getDefaultRouteByRole(currentRole)
})

export default router
