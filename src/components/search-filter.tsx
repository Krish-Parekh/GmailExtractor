import React from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { parseAsString, parseAsIsoDate, useQueryStates } from 'nuqs'
import { Loader2, RefreshCcwIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export const formSchema = z.object({
    from_email: z.string().email({ message: "Invalid email address" }).optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
})

interface SearchParams {
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    isLoading: boolean;
}

export default function SearchFilter({ onSubmit, isLoading }: SearchParams) {
    const [searchParams, setSearchParams] = useQueryStates({
        from_email: parseAsString.withDefault(''),
        start_date: parseAsIsoDate.withDefault(new Date()).withOptions({ clearOnDefault: true }),
        end_date: parseAsIsoDate.withDefault(new Date()).withOptions({ clearOnDefault: true }),
    }, {
        clearOnDefault: true,
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            from_email: searchParams.from_email,
            start_date: searchParams.start_date,
            end_date: searchParams.end_date,
        },
    })

    function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setSearchParams({
            [name]: value,
        })
    }

    function handleReset() {
        form.reset()
        setSearchParams({
            from_email: null,
            start_date: null,
            end_date: null,
        })
    }

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle className='text-lg font-semibold'>Search Filters</CardTitle>
                <Button variant="outline" size="icon" onClick={handleReset}>
                    <RefreshCcwIcon className='w-4 h-4' />
                </Button>
            </CardHeader>
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
                            name="start_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Start Date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => {
                                                    field.onChange(date)
                                                    setSearchParams({
                                                        start_date: date || new Date(),
                                                    })
                                                }}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("2000-01-01")
                                                }
                                                captionLayout="dropdown"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="end_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>End Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>End Date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => {
                                                    field.onChange(date)
                                                    setSearchParams({
                                                        end_date: date || new Date(),
                                                    })
                                                }}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("2000-01-01")
                                                }
                                                captionLayout="dropdown"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className='self-end col-span-3'>
                            {isLoading && <Loader2 className='w-4 h-4 animate-spin' />}
                            Search
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
