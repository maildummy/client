import fetch from "cross-fetch";
import { Inbox, MailMetadata, Mail, List, ClientConfig } from "./types";

const domain = process?.env?.MAILDUMMY_DOMAIN || "maildummy.io";

export class MaildummyClient {
  private mails: { [key: string]: string[] } = {};
  private apiKey: string;
  constructor(config?: ClientConfig) {
    const apiKey = config?.apiKey || process.env.MAILDUMMY_API_KEY;
    if (!apiKey) {
      throw Error(
        "No API key provided, please provide the apiKey config option, or set the MAILDUMMY_API_KEY environment variable"
      );
    }
    this.apiKey = apiKey;
  }

  /**
   * Create a new inbox
   * @returns Promise<Inbox>
   */
  createInbox = async (): Promise<Inbox> => {
    const res = await fetch(`https://api.${domain}/v1/inboxes`, {
      method: "POST",
      headers: { Authorization: this.apiKey },
    });

    const { data } = await res.json();

    const { created_at, ...inbox } = data.inbox;

    return {
      ...inbox,
      createdAt: created_at,
    };
  };

  /**
   * Delete an inbox
   * @param uuid uuid of the inbox to delete
   * @returns Promise<boolean>
   */
  deleteInbox = async (uuid: string): Promise<boolean> => {
    const res = await fetch(`https://api.${domain}/v1/inboxes/${uuid}`, {
      method: "DELETE",
      headers: { Authorization: this.apiKey },
    });

    return res.ok;
  };

  /**
   * Get list of inboxes
   * @param pageToken Provide a nextPageToken from a previous response here, to fetch the next page
   * @returns Promise<Inbox>
   */
  listInboxes = async (
    pageToken?: string
  ): Promise<List<{ inboxes: Inbox[] }>> => {
    const url = new URL(`https://api.${domain}/v1/inboxes`);
    if (pageToken) {
      url.searchParams.append("next_page", pageToken);
    }
    const res = await fetch(url, {
      headers: { Authorization: this.apiKey },
    });

    const { data } = await res.json();

    return {
      nextPageToken: data.next_page,
      inboxes: data.inboxes.map((raw: any) => {
        const { created_at, ...inbox } = raw;

        return {
          ...inbox,
          createdAt: created_at,
        };
      }),
    };
  };

  /**
   * Get content and attachments for a single email
   *
   * @param mailUuid uuid of the mail to fetch
   * @returns Promise<Mail>
   */
  getMail = async (mailUuid: string): Promise<Mail> => {
    const res = await fetch(`https://api.${domain}/v1/mails/${mailUuid}`, {
      headers: { Authorization: this.apiKey },
    });

    const { data } = await res.json();
    const { message_spam_score, ...mail } = data.mail;

    return mail;
  };

  /**
   * Delete a mail
   * @param uuid uuid of the mail to delete
   * @returns Promise<boolean>
   */
  deleteMail = async (uuid: string): Promise<boolean> => {
    const res = await fetch(`https://api.${domain}/v1/mails/${uuid}`, {
      method: "DELETE",
      headers: { Authorization: this.apiKey },
    });

    return res.ok;
  };

  /**
   * Get list of mails for an inbox
   * @param inboxUuid uuid of the inbox to fetch mails for
   * @param pageToken Provide a nextPageToken from a previous response here, to fetch the next page
   * @returns Promise<Inbox>
   */
  listMails = async (
    inboxUuid: string,
    pageToken?: string
  ): Promise<List<{ mails: MailMetadata[] }>> => {
    const url = new URL(`https://api.${domain}/v1/mails/`);
    if (pageToken) {
      url.searchParams.append("next_page", pageToken);
    }
    const res = await fetch(url, {
      headers: { Authorization: this.apiKey },
    });

    const { data } = await res.json();

    return {
      nextPageToken: data.next_page,
      mails: data.mails.map((raw: any) => {
        const { message_spam_score, created_at, ...mail } = raw;

        return {
          ...mail,
          createdAt: created_at,
        } as MailMetadata;
      }),
    };
  };

  /**
   * Will return any mails for the inbox which were not fetched by the client instance yet
   *
   * @param inboxUuid inbox to fetch emails for
   * @param timeoutInSeconds time to wait for a new email to arrive, when none are received, an error is thrown
   */
  waitForNewMails = async (
    inboxUuid: string,
    timeoutInSeconds = 10
  ): Promise<MailMetadata[]> => {
    return new Promise((resolve, reject) => {
      let currentTimeout: any;
      const timeout = setTimeout(() => {
        if (currentTimeout) clearTimeout(currentTimeout);

        reject(`No mails found within timeout of ${timeoutInSeconds}`);
      }, timeoutInSeconds * 1000);

      const getNewMails = async () => {
        const res = await fetch(
          `https://api.${domain}/v1/mails/inbox/${inboxUuid}`,
          {
            headers: { Authorization: this.apiKey },
          }
        );

        const { data } = await res.json();
        const mails: MailMetadata[] = data.mails.map((raw: any) => {
          const { message_spam_score, created_at, ...mail } = raw;
          return {
            ...mail,
            createdAt: created_at,
          } as MailMetadata;
        });

        const newMails = mails?.filter(
          (mail: MailMetadata) => !this.mails[inboxUuid]?.includes(mail.uuid)
        );
        if (newMails.length) {
          clearTimeout(timeout);

          // Keep track for future requests, so we can identify new mails
          if (!this.mails[inboxUuid]) {
            this.mails[inboxUuid] = [];
          }
          this.mails[inboxUuid] = [
            ...this.mails[inboxUuid],
            ...newMails.map((mail) => mail.uuid),
          ];

          resolve(newMails);

          return;
        }

        // No new mails, try again after timeout
        currentTimeout = setTimeout(getNewMails, 1000);
      };

      // Trigger first get request
      getNewMails();
    });
  };
}
