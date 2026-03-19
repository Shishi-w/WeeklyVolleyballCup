
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少为 6 位' }
  }
  return { valid: true }
}

export function validateFormTitle(title: string): { valid: boolean; message?: string } {
  if (!title.trim()) {
    return { valid: false, message: '表单标题不能为空' }
  }
  if (title.length > 100) {
    return { valid: false, message: '表单标题不能超过 100 个字符' }
  }
  return { valid: true }
}
