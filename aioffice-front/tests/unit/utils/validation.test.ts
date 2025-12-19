import { describe, it, expect } from 'vitest'
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateUsername,
  validatePassword,
  validateTimeRange,
  validateLeaveApproval,
  validateGoOutApproval,
  validateMakeCardApproval,
  validateDepartment,
  validateTodo,
  validateKnowledgeFileType
} from '@/utils/validation'

describe('Validation Utilities', () => {
  describe('validateRequired', () => {
    it('should return invalid for null value', () => {
      const result = validateRequired(null, '字段')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('字段不能为空')
    })

    it('should return invalid for undefined value', () => {
      const result = validateRequired(undefined, '字段')
      expect(result.valid).toBe(false)
    })

    it('should return invalid for empty string', () => {
      const result = validateRequired('', '字段')
      expect(result.valid).toBe(false)
    })

    it('should return invalid for whitespace-only string', () => {
      const result = validateRequired('   ', '字段')
      expect(result.valid).toBe(false)
    })

    it('should return invalid for empty array', () => {
      const result = validateRequired([], '字段')
      expect(result.valid).toBe(false)
    })

    it('should return valid for non-empty string', () => {
      const result = validateRequired('test', '字段')
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    it('should return valid for non-empty array', () => {
      const result = validateRequired([1, 2], '字段')
      expect(result.valid).toBe(true)
    })
  })

  describe('validateMinLength', () => {
    it('should return invalid when string is too short', () => {
      const result = validateMinLength('ab', 5, '字段')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('字段至少需要5个字符')
    })

    it('should return valid when string meets minimum length', () => {
      const result = validateMinLength('abcde', 5, '字段')
      expect(result.valid).toBe(true)
    })

    it('should return invalid for empty string', () => {
      const result = validateMinLength('', 1, '字段')
      expect(result.valid).toBe(false)
    })
  })


  describe('validateMaxLength', () => {
    it('should return invalid when string exceeds max length', () => {
      const result = validateMaxLength('abcdef', 5, '字段')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('字段不能超过5个字符')
    })

    it('should return valid when string is within max length', () => {
      const result = validateMaxLength('abc', 5, '字段')
      expect(result.valid).toBe(true)
    })

    it('should return valid for empty string', () => {
      const result = validateMaxLength('', 5, '字段')
      expect(result.valid).toBe(true)
    })
  })

  describe('validateUsername', () => {
    it('should return invalid for empty username', () => {
      const result = validateUsername('')
      expect(result.valid).toBe(false)
    })

    it('should return invalid for username shorter than 2 characters', () => {
      const result = validateUsername('a')
      expect(result.valid).toBe(false)
    })

    it('should return invalid for username longer than 50 characters', () => {
      const result = validateUsername('a'.repeat(51))
      expect(result.valid).toBe(false)
    })

    it('should return valid for valid username', () => {
      const result = validateUsername('张三')
      expect(result.valid).toBe(true)
    })
  })

  describe('validatePassword', () => {
    it('should return invalid for empty password', () => {
      const result = validatePassword('')
      expect(result.valid).toBe(false)
    })

    it('should return invalid for password shorter than 6 characters', () => {
      const result = validatePassword('12345')
      expect(result.valid).toBe(false)
    })

    it('should return valid for password with 6+ characters', () => {
      const result = validatePassword('123456')
      expect(result.valid).toBe(true)
    })
  })

  describe('validateTimeRange', () => {
    it('should return invalid when start time is missing', () => {
      const result = validateTimeRange(0, 1705315845)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('请选择开始时间')
    })

    it('should return invalid when end time is missing', () => {
      const result = validateTimeRange(1705315845, 0)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('请选择结束时间')
    })

    it('should return invalid when end time is before start time', () => {
      const result = validateTimeRange(1705315845, 1705315800)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('结束时间必须晚于开始时间')
    })

    it('should return invalid when end time equals start time', () => {
      const result = validateTimeRange(1705315845, 1705315845)
      expect(result.valid).toBe(false)
    })

    it('should return valid for valid time range', () => {
      const result = validateTimeRange(1705315845, 1705319445)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateLeaveApproval', () => {
    it('should return invalid when type is missing', () => {
      const result = validateLeaveApproval({
        startTime: 1705315845,
        endTime: 1705319445,
        reason: '家中有事需要请假'
      })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('请选择请假类型')
    })

    it('should return invalid when time range is invalid', () => {
      const result = validateLeaveApproval({
        type: 1,
        startTime: 0,
        endTime: 1705319445,
        reason: '家中有事需要请假'
      })
      expect(result.valid).toBe(false)
    })

    it('should return invalid when reason is too short', () => {
      const result = validateLeaveApproval({
        type: 1,
        startTime: 1705315845,
        endTime: 1705319445,
        reason: '请假'
      })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('请假原因至少需要5个字符')
    })

    it('should return valid for complete leave approval', () => {
      const result = validateLeaveApproval({
        type: 1,
        startTime: 1705315845,
        endTime: 1705319445,
        reason: '家中有事需要请假'
      })
      expect(result.valid).toBe(true)
    })
  })


  describe('validateGoOutApproval', () => {
    it('should return invalid when time range is invalid', () => {
      const result = validateGoOutApproval({
        startTime: 0,
        endTime: 1705319445,
        reason: '外出办事'
      })
      expect(result.valid).toBe(false)
    })

    it('should return invalid when reason is missing', () => {
      const result = validateGoOutApproval({
        startTime: 1705315845,
        endTime: 1705319445,
        reason: ''
      })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('外出原因不能为空')
    })

    it('should return valid for complete go-out approval', () => {
      const result = validateGoOutApproval({
        startTime: 1705315845,
        endTime: 1705319445,
        reason: '外出办事'
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('validateMakeCardApproval', () => {
    it('should return invalid when date is missing', () => {
      const result = validateMakeCardApproval({
        checkType: 1,
        reason: '忘记打卡'
      })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('请选择补卡日期')
    })

    it('should return invalid when checkType is missing', () => {
      const result = validateMakeCardApproval({
        date: 1705315845,
        reason: '忘记打卡'
      })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('请选择补卡类型')
    })

    it('should return invalid when reason is missing', () => {
      const result = validateMakeCardApproval({
        date: 1705315845,
        checkType: 1,
        reason: ''
      })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('补卡原因不能为空')
    })

    it('should return valid for complete make-card approval', () => {
      const result = validateMakeCardApproval({
        date: 1705315845,
        checkType: 1,
        reason: '忘记打卡'
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('validateDepartment', () => {
    it('should return invalid when name is missing', () => {
      const result = validateDepartment({})
      expect(result.valid).toBe(false)
      expect(result.message).toBe('部门名称不能为空')
    })

    it('should return invalid when name exceeds 50 characters', () => {
      const result = validateDepartment({ name: 'a'.repeat(51) })
      expect(result.valid).toBe(false)
    })

    it('should return valid for valid department', () => {
      const result = validateDepartment({ name: '技术部' })
      expect(result.valid).toBe(true)
    })
  })

  describe('validateTodo', () => {
    it('should return invalid when title is missing', () => {
      const result = validateTodo({ deadlineAt: 1705315845 })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('待办标题不能为空')
    })

    it('should return invalid when title exceeds 100 characters', () => {
      const result = validateTodo({
        title: 'a'.repeat(101),
        deadlineAt: 1705315845
      })
      expect(result.valid).toBe(false)
    })

    it('should return invalid when deadline is missing', () => {
      const result = validateTodo({ title: '完成报告' })
      expect(result.valid).toBe(false)
      expect(result.message).toBe('请选择截止时间')
    })

    it('should return valid for complete todo', () => {
      const result = validateTodo({
        title: '完成报告',
        deadlineAt: 1705315845
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('validateKnowledgeFileType', () => {
    it('should return valid for .md files', () => {
      const result = validateKnowledgeFileType('document.md')
      expect(result.valid).toBe(true)
    })

    it('should return valid for .pdf files', () => {
      const result = validateKnowledgeFileType('document.pdf')
      expect(result.valid).toBe(true)
    })

    it('should return valid for .docx files', () => {
      const result = validateKnowledgeFileType('document.docx')
      expect(result.valid).toBe(true)
    })

    it('should return valid for .txt files', () => {
      const result = validateKnowledgeFileType('document.txt')
      expect(result.valid).toBe(true)
    })

    it('should return invalid for unsupported file types', () => {
      const result = validateKnowledgeFileType('document.exe')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('不支持的文件类型')
    })

    it('should be case insensitive', () => {
      expect(validateKnowledgeFileType('document.PDF').valid).toBe(true)
      expect(validateKnowledgeFileType('document.MD').valid).toBe(true)
    })
  })
})
