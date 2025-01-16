export type InviteT = {
  username: string
  first_name: string
  last_name: string
  is_bot: boolean
  language_code: string
  inviter: string
  invitation_codes: string
  telegram_id: number
  email?: string
  photo_url?: string
}

export type TSupabaseUser = {
  inviter?: string | null
  is_bot?: boolean | null
  language_code?: string | null
  telegram_id?: number | null
  email?: string | null
  created_at?: Date
  user_id?: string
  aggregateverifier?: string | null
  admin_email?: string | null
  role?: string | null
  display_name?: string | null
  select_izbushka?: string | null
}

export type TUser = Readonly<{
  auth_date?: number
  first_name: string
  last_name?: string
  hash?: string
  id?: number
  photo_url?: string
  username?: string
}>

export type SupabaseUser = TUser & TSupabaseUser

export type CreateUserReturn = {
  userData: SupabaseUser[]
  user_id: string
  isUserExist: boolean
  error: any
}
