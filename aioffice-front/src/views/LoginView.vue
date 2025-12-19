<script setup lang="ts">
/**
 * Login View Component
 * Requirements: 1.1, 1.5 - User authentication and error display
 */
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

// Form state
const loginForm = reactive({
  name: '',
  password: '',
});

// UI state
const loading = ref(false);
const formRef = ref();

// Form validation rules
const rules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 100, message: '密码长度在 6 到 100 个字符', trigger: 'blur' },
  ],
};

/**
 * Handle login form submission
 * Requirements: 1.1 - WHEN a user submits valid credentials THEN authenticate
 * Requirements: 1.5 - WHEN invalid credentials THEN display error within 2 seconds
 */
async function handleLogin() {
  if (!formRef.value) return;
  
  try {
    // Validate form
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    loading.value = true;
    
    // Attempt login
    await userStore.login(loginForm.name, loginForm.password);
    
    // Success - redirect to dashboard
    ElMessage.success('登录成功');
    router.push('/');
  } catch (error: any) {
    // Requirements: 1.5 - Display error message within 2 seconds
    const errorMessage = error?.message || '登录失败，请检查用户名和密码';
    ElMessage.error(errorMessage);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>
    
    <!-- 居中登录卡片 -->
    <div class="login-card">
      <div class="logo-area">
        <span class="logo-icon">🚀</span>
        <span class="logo-text">AIOffice</span>
      </div>
      
      <div class="login-header">
        <h2 class="login-title">欢迎回来</h2>
        <p class="login-subtitle">登录以继续使用</p>
      </div>
      
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="name">
          <el-input
            v-model="loginForm.name"
            placeholder="用户名"
            prefix-icon="User"
            size="large"
            :disabled="loading"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            show-password
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0f7fa 0%, #e3f2fd 50%, #f3e5f5 100%);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: float 8s ease-in-out infinite;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #80deea, #4dd0e1);
  top: -10%;
  left: -5%;
  animation-delay: 0s;
}

.blob-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #b39ddb, #9575cd);
  bottom: -10%;
  right: -5%;
  animation-delay: 2s;
}

.blob-3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #81d4fa, #4fc3f7);
  top: 50%;
  right: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -20px) scale(1.05); }
  66% { transform: translate(-10px, 10px) scale(0.95); }
}

/* 登录卡片 - 毛玻璃效果 */
.login-card {
  width: 380px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  z-index: 1;
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 36px;
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #0097a7, #7b1fa2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #37474f;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 14px;
  color: #78909c;
  margin: 0;
}

.login-form {
  width: 100%;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(0, 151, 167, 0.3);
  background: rgba(255, 255, 255, 0.95);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #0097a7;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0, 151, 167, 0.1);
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px;
  background: linear-gradient(135deg, #0097a7 0%, #00838f 100%);
  border: none;
  letter-spacing: 4px;
  transition: all 0.3s ease;
}

.login-button:hover {
  background: linear-gradient(135deg, #00838f 0%, #006064 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 151, 167, 0.35);
}

/* 响应式 */
@media (max-width: 480px) {
  .login-card {
    width: calc(100% - 32px);
    margin: 16px;
    padding: 32px 24px;
  }
  
  .login-title {
    font-size: 22px;
  }
  
  .logo-text {
    font-size: 24px;
  }
}
</style>
