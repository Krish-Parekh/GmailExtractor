import React from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from './ui/card'
import { parseAsString, useQueryStates } from 'nuqs'
import { Loader2 } from 'lucide-react'

export const formSchema = z.object({
    from_email: z.string().email({ message: "Invalid email address" }).optional(),
    keyword: z.string().optional(),
})

interface SearchParams {
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    isLoading: boolean;
}

export default function SearchFilter({ onSubmit, isLoading }: SearchParams) {
    const [searchParams, setSearchParams] = useQueryStates({
        from_email: parseAsString.withDefault(''),
        keyword: parseAsString.withDefault(''),
    }, {
        clearOnDefault: true,
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            from_email: searchParams.from_email,
            keyword: searchParams.keyword,
        },
    })

    function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setSearchParams({
            [name]: value,
        })
    }

    return (
        <Card>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='grid grid-cols-3 gap-4 items-center'>
                        <FormField
                            control={form.control}
                            name="from_email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>From Emails</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder='Enter email' value={searchParams.from_email} onChange={handleSearch} />
                                    </FormControl>
                                    <FormMessage>
                                        {form.formState.errors.from_email?.message}
                                    </FormMessage>
                                </FormItem>
                            )}
                        />
                    
                        <FormField
                            control={form.control}
                            name="keyword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Keywords</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder='Enter keyword' value={searchParams.keyword} onChange={handleSearch} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className='self-end'>
                            {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : "Search"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
