<script setup lang="ts">
/**
 * ApprovalForm Component - Form for creating approvals
 * Requirements: 5.1, 5.2, 5.3 - Create leave/go-out/make-card approvals
 * Property 12: Approval Form Validation
 */

import { ref, watch } from 'vue';
import { useUserStore } from '../../stores/user';
import type { 
  CreateLeaveApprovalRequest,
  CreateGoOutApprovalRequest,
  CreateMakeCardApprovalRequest
} from '../../types/approval';

type ApprovalFormType = 'leave' | 'goout' | 'makecard';

interface Props {
  type?: ApprovalFormType;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'leave',
  loading: false,
});

const emit = defineEmits<{
  (e: 'submit', data: CreateLeaveApprovalRequest | CreateGoOutApprovalRequest | CreateMakeCardApprovalRequest): void;
  (e: 'cancel'): void;
}>();

// Form type selection
const formType = ref<ApprovalFormType>(props.type);

// Leave form data
const leaveForm = ref({
  type: 1,        // 请假类型
  startTime: 0,
  endTime: 0,
  duration: 0,
  reason: '',
  timeType: 2,    // Default to days
});

// Go-out form data
const goOutForm = ref({
  startTime: 0,
  endTime: 0,
  duration: 0,
  reason: '',
});

// Make-card form data
const makeCardForm = ref({
  date: 0,
  day: 0,
  workCheckType: 1,
  reason: '',
});

// Date inputs for form binding
const leaveStartDate = ref('');
const leaveEndDate = ref('');
const goOutStartDate = ref('');
const goOutEndDate = ref('');
const makeCardDate = ref('');

// Leave type options
const leaveTypeOptions = [
  { value: 1, label: '事假' },
  { value: 2, label: '调休' },
  { value: 3, label: '病假' },
  { value: 4, label: '年假' },
  { value: 5, label: '产假' },
  { value: 6, label: '陪产假' },
  { value: 7, label: '婚假' },
  { value: 8, label: '丧假' },
  { value: 9, label: '哺乳假' },
];

// Check type options
const checkTypeOptions = [
  { value: 1, label: '上班打卡' },
  { value: 2, label: '下班打卡' },
];

// Time type options
const timeTypeOptions = [
  { value: 1, label: '小时' },
  { value: 2, label: '天' },
];


// Validation errors
const errors = ref<Record<string, string>>({});

/**
 * Validate leave form
 * Property 12: Approval Form Validation - leave form requires type, times, duration, reason
 */
function validateLeaveForm(): boolean {
  errors.value = {};
  
  if (!leaveForm.value.type) {
    errors.value.leaveType = '请选择请假类型';
  }
  if (!leaveStartDate.value) {
    errors.value.leaveStartTime = '请选择开始时间';
  }
  if (!leaveEndDate.value) {
    errors.value.leaveEndTime = '请选择结束时间';
  }
  if (!leaveForm.value.reason || leaveForm.value.reason.trim().length < 5) {
    errors.value.leaveReason = '请填写请假原因（至少5个字）';
  }
  
  return Object.keys(errors.value).length === 0;
}

/**
 * Validate go-out form
 * Property 12: Approval Form Validation - go-out form requires times, duration, reason
 */
function validateGoOutForm(): boolean {
  errors.value = {};
  
  if (!goOutStartDate.value) {
    errors.value.goOutStartTime = '请选择外出开始时间';
  }
  if (!goOutEndDate.value) {
    errors.value.goOutEndTime = '请选择外出结束时间';
  }
  if (!goOutForm.value.reason || goOutForm.value.reason.trim().length === 0) {
    errors.value.goOutReason = '请填写外出原因';
  }
  
  return Object.keys(errors.value).length === 0;
}

/**
 * Validate make-card form
 * Property 12: Approval Form Validation - make-card form requires date, checkType, reason
 */
function validateMakeCardForm(): boolean {
  errors.value = {};
  
  if (!makeCardDate.value) {
    errors.value.makeCardDate = '请选择补卡日期';
  }
  if (!makeCardForm.value.workCheckType) {
    errors.value.makeCardCheckType = '请选择补卡类型';
  }
  if (!makeCardForm.value.reason || makeCardForm.value.reason.trim().length === 0) {
    errors.value.makeCardReason = '请填写补卡原因';
  }
  
  return Object.keys(errors.value).length === 0;
}

// Convert date string to timestamp
function dateToTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

// Calculate duration between two dates
function calculateDuration(startDate: string, endDate: string, timeType: number): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffMs = end - start;
  if (timeType === 1) {
    // Hours
    return Math.ceil(diffMs / (1000 * 60 * 60));
  } else {
    // Days
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}

// Watch for date changes to update timestamps
watch([leaveStartDate, leaveEndDate], () => {
  leaveForm.value.startTime = dateToTimestamp(leaveStartDate.value);
  leaveForm.value.endTime = dateToTimestamp(leaveEndDate.value);
  leaveForm.value.duration = calculateDuration(
    leaveStartDate.value, 
    leaveEndDate.value, 
    leaveForm.value.timeType
  );
});

watch([goOutStartDate, goOutEndDate], () => {
  goOutForm.value.startTime = dateToTimestamp(goOutStartDate.value);
  goOutForm.value.endTime = dateToTimestamp(goOutEndDate.value);
  goOutForm.value.duration = calculateDuration(goOutStartDate.value, goOutEndDate.value, 1);
});

watch(makeCardDate, () => {
  makeCardForm.value.date = dateToTimestamp(makeCardDate.value);
  // day 格式为 YYYYMMDD
  if (makeCardDate.value) {
    makeCardForm.value.day = parseInt(makeCardDate.value.replace(/-/g, ''));
  }
});


// Get current user ID from store
const userStore = useUserStore();

// Handle form submission
function handleSubmit() {
  let isValid = false;
  let data: CreateLeaveApprovalRequest | CreateGoOutApprovalRequest | CreateMakeCardApprovalRequest;
  
  const userId = userStore.user?.id || '';
  
  switch (formType.value) {
    case 'leave':
      isValid = validateLeaveForm();
      data = {
        userId,
        type: leaveForm.value.type,
        title: `${leaveTypeOptions.find(o => o.value === leaveForm.value.type)?.label || '请假'}申请`,
        reason: leaveForm.value.reason,
        leave: {
          type: leaveForm.value.type,
          startTime: leaveForm.value.startTime,
          endTime: leaveForm.value.endTime,
          duration: leaveForm.value.duration,
          reason: leaveForm.value.reason,
          timeType: leaveForm.value.timeType,
        },
      };
      break;
    case 'goout':
      isValid = validateGoOutForm();
      data = {
        userId,
        type: 10, // 外出类型
        title: '外出申请',
        reason: goOutForm.value.reason,
        goOut: {
          startTime: goOutForm.value.startTime,
          endTime: goOutForm.value.endTime,
          duration: goOutForm.value.duration,
          reason: goOutForm.value.reason,
        },
      };
      break;
    case 'makecard':
      isValid = validateMakeCardForm();
      data = {
        userId,
        type: 11, // 补卡类型
        title: '补卡申请',
        reason: makeCardForm.value.reason,
        makeCard: {
          date: makeCardForm.value.date,
          day: makeCardForm.value.day,
          workCheckType: makeCardForm.value.workCheckType,
          reason: makeCardForm.value.reason,
        },
      };
      break;
    default:
      return;
  }
  
  if (isValid) {
    emit('submit', data);
  }
}

// Handle cancel
function handleCancel() {
  emit('cancel');
}

// Reset form
function resetForm() {
  errors.value = {};
  leaveForm.value = { type: 1, startTime: 0, endTime: 0, duration: 0, reason: '', timeType: 2 };
  goOutForm.value = { startTime: 0, endTime: 0, duration: 0, reason: '' };
  makeCardForm.value = { date: 0, day: 0, workCheckType: 1, reason: '' };
  leaveStartDate.value = '';
  leaveEndDate.value = '';
  goOutStartDate.value = '';
  goOutEndDate.value = '';
  makeCardDate.value = '';
}

// Expose validation functions for testing
defineExpose({
  validateLeaveForm,
  validateGoOutForm,
  validateMakeCardForm,
  leaveForm,
  goOutForm,
  makeCardForm,
  errors,
});
</script>

<template>
  <div class="approval-form">
    <div class="form-type-selector">
      <button 
        :class="['type-btn', { active: formType === 'leave' }]"
        @click="formType = 'leave'"
      >
        请假
      </button>
      <button 
        :class="['type-btn', { active: formType === 'goout' }]"
        @click="formType = 'goout'"
      >
        外出
      </button>
      <button 
        :class="['type-btn', { active: formType === 'makecard' }]"
        @click="formType = 'makecard'"
      >
        补卡
      </button>
    </div>

    <!-- Leave Form -->
    <form v-if="formType === 'leave'" class="form-content" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">请假类型 <span class="required">*</span></label>
        <select v-model="leaveForm.type" class="form-input">
          <option v-for="opt in leaveTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <span v-if="errors.leaveType" class="error-msg">{{ errors.leaveType }}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label">开始时间 <span class="required">*</span></label>
        <input v-model="leaveStartDate" type="datetime-local" class="form-input" />
        <span v-if="errors.leaveStartTime" class="error-msg">{{ errors.leaveStartTime }}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label">结束时间 <span class="required">*</span></label>
        <input v-model="leaveEndDate" type="datetime-local" class="form-input" />
        <span v-if="errors.leaveEndTime" class="error-msg">{{ errors.leaveEndTime }}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label">时长单位</label>
        <select v-model="leaveForm.timeType" class="form-input">
          <option v-for="opt in timeTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">时长</label>
        <input :value="leaveForm.duration" type="number" class="form-input" readonly />
      </div>
      
      <div class="form-group">
        <label class="form-label">请假原因 <span class="required">*</span></label>
        <textarea v-model="leaveForm.reason" class="form-textarea" rows="3" placeholder="请填写请假原因（至少5个字）"></textarea>
        <span v-if="errors.leaveReason" class="error-msg">{{ errors.leaveReason }}</span>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">提交</button>
        <button type="button" class="btn btn-secondary" @click="handleCancel">取消</button>
      </div>
    </form>


    <!-- Go-Out Form -->
    <form v-if="formType === 'goout'" class="form-content" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">外出开始时间 <span class="required">*</span></label>
        <input v-model="goOutStartDate" type="datetime-local" class="form-input" />
        <span v-if="errors.goOutStartTime" class="error-msg">{{ errors.goOutStartTime }}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label">外出结束时间 <span class="required">*</span></label>
        <input v-model="goOutEndDate" type="datetime-local" class="form-input" />
        <span v-if="errors.goOutEndTime" class="error-msg">{{ errors.goOutEndTime }}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label">时长（小时）</label>
        <input :value="goOutForm.duration" type="number" class="form-input" readonly />
      </div>
      
      <div class="form-group">
        <label class="form-label">外出原因 <span class="required">*</span></label>
        <textarea v-model="goOutForm.reason" class="form-textarea" rows="3" placeholder="请填写外出原因"></textarea>
        <span v-if="errors.goOutReason" class="error-msg">{{ errors.goOutReason }}</span>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">提交</button>
        <button type="button" class="btn btn-secondary" @click="handleCancel">取消</button>
      </div>
    </form>

    <!-- Make-Card Form -->
    <form v-if="formType === 'makecard'" class="form-content" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">补卡日期 <span class="required">*</span></label>
        <input v-model="makeCardDate" type="date" class="form-input" />
        <span v-if="errors.makeCardDate" class="error-msg">{{ errors.makeCardDate }}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label">补卡类型 <span class="required">*</span></label>
        <select v-model="makeCardForm.workCheckType" class="form-input">
          <option v-for="opt in checkTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <span v-if="errors.makeCardCheckType" class="error-msg">{{ errors.makeCardCheckType }}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label">补卡原因 <span class="required">*</span></label>
        <textarea v-model="makeCardForm.reason" class="form-textarea" rows="3" placeholder="请填写补卡原因"></textarea>
        <span v-if="errors.makeCardReason" class="error-msg">{{ errors.makeCardReason }}</span>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">提交</button>
        <button type="button" class="btn btn-secondary" @click="handleCancel">取消</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.approval-form {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.form-type-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 16px;
}

.type-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.type-btn.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.required {
  color: #f56c6c;
}

.form-input,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.error-msg {
  font-size: 12px;
  color: #f56c6c;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #409eff;
  color: #fff;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-primary:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.btn-secondary:hover {
  border-color: #409eff;
  color: #409eff;
}
</style>
