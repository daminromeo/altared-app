'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

interface UserMenuProps {
  userProfile: {
    full_name: string | null
    avatar_url: string | null
    email: string | null
  } | null
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (email) {
    return email[0].toUpperCase()
  }
  return 'U'
}

export function UserMenu({ userProfile }: UserMenuProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = userProfile?.full_name || userProfile?.email || 'User'
  const initials = getInitials(
    userProfile?.full_name ?? null,
    userProfile?.email ?? null
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1.5 outline-none hover:bg-[#FAF8F5] focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar size="default">
          {userProfile?.avatar_url && (
            <AvatarImage src={userProfile.avatar_url} alt={displayName} />
          )}
          <AvatarFallback className="bg-[#8B9F82]/20 text-[#8B9F82] text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium text-[#2D2D2D] md:inline-block">
          {displayName}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#2D2D2D]">
                {displayName}
              </span>
              {userProfile?.email && (
                <span className="text-xs text-[#7A7A7A]">
                  {userProfile.email}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/settings')}
          className="cursor-pointer"
        >
          <Settings className="size-4" />
          Profile & Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          variant="destructive"
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
