import { useCallback, useState } from 'react'
import { Attachment, Email, Message, SearchParams } from '@/types/main'
import { useSession } from 'next-auth/react'
import JSZip from 'jszip'

const MESSAGES_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
const MESSAGE_DETAILS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
const MESSAGE_ATTACHMENT_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
interface GetMessagesParams extends SearchParams {
  token: string
}

interface GetMessageDetailsParams {
  id: string
  token: string
}

export async function getMessages({ from_email, start_date, end_date, token }: GetMessagesParams): Promise<Message[]> {
  try {
    let q = "has:attachment "
    if (from_email) {
      q += `from:${from_email}`
    }
    if (start_date) {
      q += ` after:${start_date.toISOString().split("T")[0]}`
    }
    if (end_date) {
      q += ` before:${end_date.toISOString().split("T")[0]}`
    }
    const url = `${MESSAGES_URL}?q=${q}&maxResults=10`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch messages")
    }
    const data = await response.json()
    console.log("data", data)
    return data.messages as Message[]
  } catch (error) {
    return []
  }
}

export async function getMessageDetails({ id, token }: GetMessageDetailsParams) {
  try {
    const url = `${MESSAGE_DETAILS_URL}/${id}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch message details")
    }
    const data = await response.json()
    return data
  } catch (error) {
    return null
  }
}

export async function getAttachment(messageId: string, attachmentId: string, token: string) {
  try {
    const url = `${MESSAGE_ATTACHMENT_URL}/${messageId}/attachments/${attachmentId}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch attachment")
    }
    const attachmentData = await response.json()
    const base64 = attachmentData.data.replace(/-/g, "+").replace(/_/g, "/");
    return base64
  } catch (error) {
    return null
  }
}

function processMessageDetails(messageDetails: any[]): Email[] {
  const emails: Email[] = messageDetails.map(detail => {
    const attachments: Attachment[] = [];

    const processParts = (parts: any[]) => {
      if (!parts) return;

      parts.forEach(part => {
        if (part.filename && part.body && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            attachmentId: part.body.attachmentId,
            size: part.body.size,
            messageId: detail.id,
            subject: detail.payload.headers.find((header: { name: string }) => header.name === "Subject")?.value
          });
        }

        if (part.parts) {
          processParts(part.parts);
        }
      });
    };

    if (detail.payload.parts) {
      processParts(detail.payload.parts);
    }

    return {
      id: detail.id,
      from: detail.payload.headers.find((header: { name: string }) => header.name === "From")?.value,
      to: detail.payload.headers.find((header: { name: string }) => header.name === "To")?.value,
      subject: detail.payload.headers.find((header: { name: string }) => header.name === "Subject")?.value,
      date: detail.payload.headers.find((header: { name: string }) => header.name === "Date")?.value,
      attachments: attachments
    };
  });

  return emails;
}
export default function useEmail() {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { data: session } = useSession();
  const [emails, setEmails] = useState<Email[]>([]);

  const fetchEmails = useCallback(async ({ from_email, start_date, end_date }: SearchParams) => {
    setLoading(true);
    const messages = await getMessages({ from_email, start_date, end_date, token: session?.accessToken || "" })
    const messageDetails = await Promise.all(messages?.map(message => getMessageDetails({ id: message.id, token: session?.accessToken || "" })))
    const processedEmails = processMessageDetails(messageDetails)
    setEmails(processedEmails)
    setLoading(false);
  }, [session?.accessToken])


  const downloadAllAttachmentAsZip = useCallback(async (emails: Email[], zipName: string) => {
    try {
      setDownloading(true);
      const zip = new JSZip();
      let attachmentCount = 0;
      const usedFilenames = new Set();

      for (const email of emails) {
        if (!email.attachments || email.attachments.length === 0) continue;

        for (const attachment of email.attachments) {
          if (!attachment.attachmentId) continue;

          // Only process PDF files
          if (!attachment.mimeType.toLowerCase().includes('pdf')) continue;

          const base64Data = await getAttachment(email.id, attachment.attachmentId, session?.accessToken || "");
          if (base64Data) {

            let dateStr = '';
            if (email.date) {
              const d = new Date(email.date);
              if (!isNaN(d.getTime())) {
                dateStr = `_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              }
            }

            const extension = attachment.filename.includes('.') ?
              '.' + attachment.filename.split('.').pop() : '.pdf';

            let baseFilename = `${attachment.filename}${dateStr}${extension}`;

            // Ensure filename is unique by adding a counter if needed
            let uniqueFilename = baseFilename;
            let counter = 1;
            while (usedFilenames.has(uniqueFilename)) {
              uniqueFilename = baseFilename.replace(extension, `_${counter}${extension}`);
              counter++;
            }
            usedFilenames.add(uniqueFilename);

            // Convert base64 to binary
            const binary = atob(base64Data);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              array[i] = binary.charCodeAt(i);
            }

            // Add directly to zip root with unique filename
            zip.file(uniqueFilename, array);
            attachmentCount++;
          }
        }
      }

      if (attachmentCount === 0) {
        console.log("No PDF attachments found to download");
        return;
      }

      // Generate and download the single zip file after processing all emails
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error downloading attachments:", error);
    } finally {
      setDownloading(false);
    }
  }, [session?.accessToken]);


  const downloadAllAttachments = useCallback(async () => {
    if (emails.length === 0) {
      return;
    }
    const zipName = "attachments";
    await downloadAllAttachmentAsZip(emails, zipName);
  }, [emails, downloadAllAttachmentAsZip]);

  return {
    loading,
    downloading,
    emails,
    fetchEmails,
    downloadAllAttachments
  }
}