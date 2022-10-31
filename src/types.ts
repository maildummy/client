export interface ClientConfig {
  apiKey?: string;
}

export type List<ListProps> = {
  count: number;
  /**
   * Provide this token as argument to a new list call, to fetch the next page of items
   */
  nextPageToken?: string;
} & ListProps;

export interface Inbox {
  uuid: string;
  address: string;
  createdAt: Date;
}

interface EmailAddress {
  address: string;
  name: string;
}

/**
 * Email summary returned by listing operations
 */
export interface MailMetadata {
  uuid: string;
  from: string;
  subject: string;
  recipient: string;
  createdAt: number;
}

/**
 * Mail data including contents and attachment urls
 */
export interface Mail {
  uuid: string;
  date: number;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  content: string;
  /**
   * Signed download urls for downloading the attachments, only valid temporarily
   */
  attachments?: string[];
}
