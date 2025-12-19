/**
 * Vue Router Configuration
 * Requirements: 1.2 - WHEN JWT_Token expires THEN redirect to login page
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useUserStore } from '../stores/user';

// Route definitions
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      title: '登录 - AIOffice',
    },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: '首页 - AIOffice',
    },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/ChatView.vue'),
    meta: {
      requiresAuth: true,
      title: '智能对话 - AIOffice',
    },
  },
  {
    path: '/todo',
    name: 'Todo',
    component: () => import('../views/TodoView.vue'),
    meta: {
      requiresAuth: true,
      title: '待办事项 - AIOffice',
    },
  },
  {
    path: '/approval',
    name: 'Approval',
    component: () => import('../views/ApprovalView.vue'),
    meta: {
      requiresAuth: true,
      title: '审批管理 - AIOffice',
    },
  },
  {
    path: '/department',
    name: 'Department',
    component: () => import('../views/DepartmentView.vue'),
    meta: {
      requiresAuth: true,
      title: '部门管理 - AIOffice',
    },
  },
  // Catch-all route for 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * Navigation Guard - Authentication Check
 * Requirements: 1.2 - WHEN JWT_Token expires THEN redirect to login page
 */
router.beforeEach((to, _from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  const userStore = useUserStore();
  const requiresAuth = to.meta.requiresAuth !== false;

  // Check authentication status
  const isAuthenticated = userStore.checkAuthentication();

  if (requiresAuth && !isAuthenticated) {
    // Not authenticated - redirect to login
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  } else if (to.path === '/login' && isAuthenticated) {
    // Already authenticated - redirect to dashboard
    next('/');
  } else {
    next();
  }
});

export default router;
