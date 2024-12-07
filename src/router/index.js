import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WelcomePage from '../views/WelcomePage.vue';
import LoginForm from '../views/LoginForm.vue';
import JavneListe from '../views/JavneListe.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'LoginForm',
    component: LoginForm 
  },
  {
    path:'/welcome',
    name:'Welcome',
    component:WelcomePage
  },
  {
    path:'/javneliste',
    name: 'JavneListe',
    component: JavneListe
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
