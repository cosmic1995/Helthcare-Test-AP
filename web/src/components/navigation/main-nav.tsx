'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { 
  LayoutDashboard,
  FolderOpen,
  FileText,
  TestTube,
  BarChart3,
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Shield
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderOpen,
    badge: '6'
  },
  {
    title: 'Requirements',
    href: '/requirements',
    icon: FileText,
    badge: '23'
  },
  {
    title: 'Tests',
    href: '/tests',
    icon: TestTube,
    badge: '12'
  },
  {
    title: 'Compliance',
    href: '/compliance',
    icon: BarChart3
  },
  {
    title: 'Team',
    href: '/team',
    icon: Users
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

// Mock user data - in real app, this would come from auth context
const currentUser = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@medtechinnovations.com',
  avatar: '/avatars/sarah.jpg',
  role: 'Compliance Manager',
  organization: 'MedTech Innovations'
}

export function MainNav() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <span className="hidden font-bold sm:inline-block">
              HealthCompliance
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6 ml-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                isActive(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Search */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
            
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-popover p-1 shadow-md z-50">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {currentUser.name}
                </div>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {currentUser.email}
                </div>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {currentUser.role} • {currentUser.organization}
                </div>
                <div className="my-1 h-px bg-border" />
                <Link
                  href="/profile"
                  className="flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
                <div className="my-1 h-px bg-border" />
                <button className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="space-y-1 px-4 py-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium",
                  isActive(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
