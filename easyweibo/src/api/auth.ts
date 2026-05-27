import request from './request'
import type { AuthResponse, LoginParams, RegisterParams, User } from '@/types'

export function login(data: LoginParams) {
  return request.post<AuthResponse>('/auth/login', data)
}

export function register(data: RegisterParams) {
  return request.post<AuthResponse>('/auth/register', data)
}

export function getCurrentUser() {
  return request.get<User>('/auth/me')
}

export function deleteAccount() {
  return request.delete('/auth/account')
}
