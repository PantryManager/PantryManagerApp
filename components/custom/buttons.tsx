'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import Link from 'next/link'
import Image from 'next/image'

export function SignInButton() {
    const { data: session, status } = useSession()

    if (status === 'loading') {
        return <Spinner></Spinner>
    }

    if (status === 'authenticated') {
        return (
            <Link href={`/profile`}>
                <Image
                    src={session.user?.image ?? '/mememan.webp'}
                    width={32}
                    height={32}
                    alt="Your Name"
                />
            </Link>
        )
    }

    return <Button onClick={() => signIn()}>Sign In</Button>
}

export function SignOutButton() {
    return <Button onClick={() => signOut()}>Sign out</Button>
}
