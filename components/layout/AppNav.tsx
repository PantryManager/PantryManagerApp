'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignInButton, SignOutButton } from '@/components/custom/buttons'
import { Button } from '@/components/ui/button'
import { Package, Home } from 'lucide-react'

export function AppNav() {
    const { data: session } = useSession()
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <nav className="border-b bg-background">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-xl font-bold">
                            Cool Pantry Manager
                        </Link>

                        {session && (
                            <div className="flex items-center gap-2">
                                <Link href="/">
                                    <Button
                                        variant={
                                            isActive('/') ? 'default' : 'ghost'
                                        }
                                        size="sm"
                                    >
                                        <Home className="mr-2 h-4 w-4" />
                                        Home
                                    </Button>
                                </Link>
                                <Link href="/pantry">
                                    <Button
                                        variant={
                                            isActive('/pantry')
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size="sm"
                                    >
                                        <Package className="mr-2 h-4 w-4" />
                                        Pantry
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {session ? (
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground">
                                    {session.user?.name}
                                </div>
                                <SignOutButton />
                            </div>
                        ) : (
                            <SignInButton />
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
