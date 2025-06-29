import React from 'react'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react';

export default function Navbar() {
    const { data: session, status } = useSession();
    const handleSignOut = () => {
        signOut();
    }
    return (
        <div className='flex items-center justify-between'>
            <h1 className="text-xl font-bold">Gmail Extractor</h1>
            <div className='flex items-center gap-x-4'>
                <Avatar className='size-10 border-2 ring-2 ring-green-400'>
                    <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                </Avatar>
                <Button className='cursor-pointer' onClick={handleSignOut} disabled={status === "loading"}>
                    {status === "loading" ? <Loader2 className='animate-spin' /> : null}
                    Logout
                </Button>
            </div>
        </div>
    )
}
