"use client"

import React, { useEffect } from 'react'
import Container from '@/components/container'
import Navbar from '@/components/navbar';
import SearchFilter, { formSchema } from '@/components/search-filter';
import { z } from 'zod';
import { useEmail } from '@/hooks/use-email';
import { DataTable } from './email/data-table';
import { columns } from './email/column';
import { Button } from './ui/button';

export default function Dashboard() {
    const { loading, emails, fetchEmails, downloadAllAttachments, downloadSelectedAttachments } = useEmail();
    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log("Dashboard", values);
        if (values.from_email) {
            fetchEmails(values.from_email);
        }
    }

    return (
        <Container className='p-4 min-h-screen space-y-8'>
            <Navbar />
            <SearchFilter onSubmit={onSubmit} isLoading={false} />
            <div className='flex gap-2'>
                <Button onClick={downloadAllAttachments}>
                    Download All emails
                </Button>
                <Button>
                    Download Selected
                </Button>
            </div>
            <DataTable columns={columns} data={emails} />
        </Container>
    )
}
