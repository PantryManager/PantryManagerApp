import AuthCheck from '@/components/custom/AuthCheck'
import { SignInButton, SignOutButton } from '@/components/custom/buttons'
import { PrismaClient } from '@/lib/generated/prisma'

export default function Home() {
    return (
        <div className="min-h-screen p-8">
            <main className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-4">Pantry Manager</h1>
                <p className="text-lg">
                    Welcome to your pantry management app.
                </p>
                <SignInButton />
                <AuthCheck>
                    <SignOutButton />
                </AuthCheck>
            </main>
        </div>
    )
}
