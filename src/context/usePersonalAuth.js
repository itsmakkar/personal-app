import { useContext } from 'react'
import { PersonalAuthContext } from './personalAuthContextBase'

export function usePersonalAuth() {
  const ctx = useContext(PersonalAuthContext)
  if (!ctx) throw new Error('usePersonalAuth must be used within PersonalAuthProvider')
  return ctx
}

