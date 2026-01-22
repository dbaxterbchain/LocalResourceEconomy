const STORAGE_KEY = 'staff-admin-token'

export const getStoredAdminToken = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

export const setStoredAdminToken = (token: string) => {
  if (typeof window === 'undefined') {
    return
  }
  if (token) {
    localStorage.setItem(STORAGE_KEY, token)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}
