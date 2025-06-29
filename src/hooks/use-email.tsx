import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import JSZip from "jszip";

export interface Attachment {
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
  messageId: string;
  subject: string;
}

export interface EmailWithAttachments {
  id: string;
  from: string;
  subject: string;
  date: string;
  attachments: Attachment[];
}

function extractAttachments(message: any) {
  const attachments: any[] = [];
  const findAttachments = (part: any) => {
    if (part.filename && part.filename.length > 0) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
        size: part.body.size,
      });
    }
    if (part.parts) {
      part.parts.forEach(findAttachments);
    }
  };
  if (message.payload) {
    findAttachments(message.payload);
  }
  return attachments;
}

async function fetchAttachmentData({ messageId, attachmentId, accessToken }: { messageId: string, attachmentId: string, accessToken: string }) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const attachmentData = await response.json();
  // Gmail returns base64url, need to convert to base64
  const base64 = attachmentData.data.replace(/-/g, "+").replace(/_/g, "/");
  return base64;
}

export function useEmail() {
  const { data: session, status } = useSession();
  const [emails, setEmails] = useState<EmailWithAttachments[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmails = useCallback(async (from_email: string) => {
    if (status !== "authenticated") return;

    setLoading(true);
    setEmails([]);

    try {
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=has:attachment from:${from_email}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.messages) {
        // Fetch all message details in parallel
        const messageDetails = await Promise.all(
          data.messages.map((message: any) =>
            fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${session?.accessToken}`,
                },
              }
            ).then(res => res.json().then(msg => ({ ...msg, id: message.id })))
          )
        );

        const allEmails: EmailWithAttachments[] = messageDetails.map((messageData: any) => {
          const subjectHeader = messageData.payload?.headers?.find((h: any) => h.name === "Subject");
          const subject = subjectHeader?.value || "No Subject";
          const fromHeader = messageData.payload?.headers?.find((h: any) => h.name === "From");
          const from = fromHeader?.value || "Unknown";
          const dateHeader = messageData.payload?.headers?.find((h: any) => h.name === "Date");
          const date = dateHeader?.value || "";
          const messageAttachments = extractAttachments(messageData);
          const pdfAttachments = messageAttachments
            .filter(
              (att) =>
                att.mimeType === "application/pdf" ||
                att.filename.toLowerCase().endsWith(".pdf")
            )
            .map((att) => ({
              ...att,
              messageId: messageData.id,
              subject,
            }));
          return {
            id: messageData.id,
            from,
            subject,
            date,
            attachments: pdfAttachments,
          };
        });

        setEmails(allEmails);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  // Download utility
  const downloadAttachmentsAsZip = useCallback(
    async (attachments: Attachment[], zipName = "attachments.zip") => {
      if (!session?.accessToken || attachments.length === 0) return;
      console.log('Zipping attachments:', attachments.map(a => a.filename));
      const zip = new JSZip();
      const usedNames = new Set<string>();
      for (const att of attachments) {
        const base64 = await fetchAttachmentData({
          messageId: att.messageId,
          attachmentId: att.attachmentId,
          accessToken: session.accessToken,
        });
        // Find the email for this attachment to get the date
        const email = emails.find(e => e.id === att.messageId);
        let dateStr = '';
        if (email && email.date) {
          // Try to format as YYYY-MM-DD
          const d = new Date(email.date);
          if (!isNaN(d.getTime())) {
            dateStr = `_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          }
        }
        // Build filename: basename_YYYY-MM-DD.ext
        const ext = att.filename.includes('.') ? '.' + att.filename.split('.').pop() : '';
        const name = att.filename.replace(ext, '');
        let filename = `${name}${dateStr}${ext}`;
        let counter = 1;
        while (usedNames.has(filename)) {
          filename = `${name}${dateStr}(${counter})${ext}`;
          counter++;
        }
        usedNames.add(filename);
        zip.file(filename, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    [session, emails]
  );

  // Download all attachments from all emails
  const downloadAllAttachments = useCallback(() => {
    const allAttachments = emails.flatMap((email) => email.attachments);
    downloadAttachmentsAsZip(allAttachments, "all_attachments.zip");
  }, [emails, downloadAttachmentsAsZip]);

  // Download selected attachments (pass array of Attachment)
  const downloadSelectedAttachments = useCallback((selected: Attachment[]) => {
    downloadAttachmentsAsZip(selected, "selected_attachments.zip");
  }, [downloadAttachmentsAsZip]);

  return { emails, loading, fetchEmails, downloadAllAttachments, downloadSelectedAttachments };
}