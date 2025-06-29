export interface SearchParams {
    from_email: string
    start_date?: Date
    end_date?: Date
}

export interface Message {
    id: string
    threadId: string;
}

export interface Attachment {
    filename: string;
    mimeType: string;
    attachmentId: string;
    size: number;
    messageId: string;
    subject: string;
}

export interface Email {
    id: string
    from: string
    to: string
    subject: string
    date: string
    attachments: Attachment[]
}