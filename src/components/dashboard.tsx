import React from 'react'
import Container from '@/components/container'
import Navbar from '@/components/navbar';
import SearchFilter, { formSchema } from '@/components/search-filter';
import { z } from 'zod';
import useEmail from '@/hooks/use-email';
import { DataTable } from './email/data-table';
import { columns } from './email/column';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
    const { fetchEmails, loading, emails, downloadAllAttachments, downloading } = useEmail();

    function onSubmit(values: z.infer<typeof formSchema>) {
        fetchEmails({
            from_email: values.from_email || "",
            start_date: values.start_date,
            end_date: values.end_date
        })
    }
    return (
        <Container className='p-4 min-h-screen space-y-8'>
            <Navbar />
            <SearchFilter onSubmit={onSubmit} isLoading={loading} />
            <Card>
                <CardHeader className='flex items-center justify-between'>
                    <CardTitle>Search Results ({emails.length})</CardTitle>
                    <Button onClick={downloadAllAttachments} disabled={downloading}>
                        {downloading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        Download All
                    </Button>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={emails} />
                </CardContent>
            </Card>
        </Container>
    )
}
