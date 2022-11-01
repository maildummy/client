export interface ClientConfig {
  /**
   * API key created on maildummy.io, overrides the environment variable MAILDUMMY_API_KEY
   */
  apiKey?: string;
}

export type List<ListProps> = {
  /**
   * Amount of items returned
   */
  count: number;
  /**
   * Provide this token as argument to a new list call, to fetch the next page of items
   */
  nextPageToken?: string;
} & ListProps;

export interface Inbox {
  /**
   * Unique id, equal to the address prefix
   */
  uuid: string;
  /**
   * Full email address
   */
  address: string;
  /**
   * Epoch time in milliseconds
   */
  createdAt: Date;
}

interface EmailAddress {
  /**
   * Email address
   */
  address: string;
  /**
   * Name as provided in the email header
   */
  name: string;
}

/**
 * Email summary returned by listing operations
 */
export interface MailMetadata {
  /**
   * Unique id, used to fetch all email data
   */
  uuid: string;
  /**
   * From address
   */
  from: string;
  /**
   * Subject of the email
   */
  subject: string;
  /**
   * Maildummy inbox address, not the complete "to" adress(es)
   */
  recipient: string;
  /**
   * Epoch time in milliseconds
   */
  createdAt: number;
}

/**
 * Mail data including contents and attachment urls
 */
export interface Mail {
  uuid: string;
  /**
   * Epoch time in milliseconds
   */
  date: number;
  /**
   * Sender
   */
  from: EmailAddress;
  /**
   * List of to addresses
   */
  to: EmailAddress[];
  /**
   * List of cc addresses
   */
  cc: EmailAddress[];
  /**
   * List of bcc addresses
   */
  bcc: EmailAddress[];
  /**
   * Subject of the email
   */
  subject: string;
  /**
   * Raw content (includes html, if provided)
   */
  content: string;
  /**
   * Signed download urls for downloading the attachments, only valid temporarily
   */
  attachments?: string[];
}
