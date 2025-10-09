import React from 'react'
import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AuthHeader() {
  return (
    <header className="flex w-full h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
