/**
 * Form validation utilities
 * Requirements: 1.1 - User authentication, 5.1 - Approval form validation
 */

export interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Validate that a value is not empty
 * @param value Value to validate
 * @param fieldName Field name for error message
 */
export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate minimum length
 * @param value String value to validate
 * @param minLength Minimum length required
 * @param fieldName Field name for error message
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationResult {
  if (!value || value.length < minLength) {
    return { valid: false, message: `${fieldName}至少需要${minLength}个字符` };
  }
  return { valid: true, message: '' };
}

/**
 * Validate maximum length
 * @param value String value to validate
 * @param maxLength Maximum length allowed
 * @param fieldName Field name for error message
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
  if (value && value.length > maxLength) {
    return { valid: false, message: `${fieldName}不能超过${maxLength}个字符` };
  }
  return { valid: true, message: '' };
}

/**
 * Validate username format
 * Requirements: 1.1 - User authentication
 * @param username Username to validate
 */
export function validateUsername(username: string): ValidationResult {
  const requiredResult = validateRequired(username, '用户名');
  if (!requiredResult.valid) return requiredResult;
  
  const minLengthResult = validateMinLength(username, 2, '用户名');
  if (!minLengthResult.valid) return minLengthResult;
  
  const maxLengthResult = validateMaxLength(username, 50, '用户名');
  if (!maxLengthResult.valid) return maxLengthResult;
  
  return { valid: true, message: '' };
}

/**
 * Validate password format
 * Requirements: 1.1 - User authentication
 * @param password Password to validate
 */
export function validatePassword(password: string): ValidationResult {
  const requiredResult = validateRequired(password, '密码');
  if (!requiredResult.valid) return requiredResult;
  
  const minLengthResult = validateMinLength(password, 6, '密码');
  if (!minLengthResult.valid) return minLengthResult;
  
  return { valid: true, message: '' };
}

/**
 * Validate time range (end time must be after start time)
 * Requirements: 5.1 - Approval form validation
 * @param startTime Start timestamp
 * @param endTime End timestamp
 */
export function validateTimeRange(startTime: number, endTime: number): ValidationResult {
  if (!startTime) {
    return { valid: false, message: '请选择开始时间' };
  }
  
  if (!endTime) {
    return { valid: false, message: '请选择结束时间' };
  }
  
  if (endTime <= startTime) {
    return { valid: false, message: '结束时间必须晚于开始时间' };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate leave approval form
 * Requirements: 5.1 - Leave approval
 */
export function validateLeaveApproval(data: {
  type?: number;
  startTime?: number;
  endTime?: number;
  reason?: string;
}): ValidationResult {
  if (!data.type) {
    return { valid: false, message: '请选择请假类型' };
  }
  
  const timeRangeResult = validateTimeRange(data.startTime || 0, data.endTime || 0);
  if (!timeRangeResult.valid) return timeRangeResult;
  
  const reasonResult = validateMinLength(data.reason || '', 5, '请假原因');
  if (!reasonResult.valid) return reasonResult;
  
  return { valid: true, message: '' };
}

/**
 * Validate go-out approval form
 * Requirements: 5.2 - Go-out approval
 */
export function validateGoOutApproval(data: {
  startTime?: number;
  endTime?: number;
  reason?: string;
}): ValidationResult {
  const timeRangeResult = validateTimeRange(data.startTime || 0, data.endTime || 0);
  if (!timeRangeResult.valid) return timeRangeResult;
  
  const reasonResult = validateRequired(data.reason, '外出原因');
  if (!reasonResult.valid) return reasonResult;
  
  return { valid: true, message: '' };
}

/**
 * Validate make-card approval form
 * Requirements: 5.3 - Make-card approval
 */
export function validateMakeCardApproval(data: {
  date?: number;
  checkType?: number;
  reason?: string;
}): ValidationResult {
  if (!data.date) {
    return { valid: false, message: '请选择补卡日期' };
  }
  
  if (!data.checkType) {
    return { valid: false, message: '请选择补卡类型' };
  }
  
  const reasonResult = validateRequired(data.reason, '补卡原因');
  if (!reasonResult.valid) return reasonResult;
  
  return { valid: true, message: '' };
}

/**
 * Validate department form
 * Requirements: 6.2 - Department form validation
 */
export function validateDepartment(data: {
  name?: string;
  parentId?: string;
}): ValidationResult {
  const nameResult = validateRequired(data.name, '部门名称');
  if (!nameResult.valid) return nameResult;
  
  const maxLengthResult = validateMaxLength(data.name || '', 50, '部门名称');
  if (!maxLengthResult.valid) return maxLengthResult;
  
  return { valid: true, message: '' };
}

/**
 * Validate todo form
 * Requirements: 4.2 - Todo creation
 */
export function validateTodo(data: {
  title?: string;
  deadlineAt?: number;
}): ValidationResult {
  const titleResult = validateRequired(data.title, '待办标题');
  if (!titleResult.valid) return titleResult;
  
  const maxLengthResult = validateMaxLength(data.title || '', 100, '待办标题');
  if (!maxLengthResult.valid) return maxLengthResult;
  
  if (!data.deadlineAt) {
    return { valid: false, message: '请选择截止时间' };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate file type for knowledge base upload
 * Requirements: 7.2 - Knowledge base file upload
 * @param filename Filename to validate
 */
export function validateKnowledgeFileType(filename: string): ValidationResult {
  const allowedExtensions = ['.md', '.pdf', '.docx', '.txt'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(extension)) {
    return { 
      valid: false, 
      message: `不支持的文件类型，仅支持 ${allowedExtensions.join(', ')} 格式` 
    };
  }
  
  return { valid: true, message: '' };
}
