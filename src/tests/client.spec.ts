import { MaildummyClient, MailMetadata } from '../index';

global.fetch = jest.fn(() => Promise.resolve(new Response('{}', { status: 200 })));

const fetch = global.fetch as jest.Mock;
const mockFetchResponse = (data: any, status = 200) => {
  fetch.mockReturnValueOnce(new Response(JSON.stringify({ data }), { status }));
};
const baseUrl = 'https://api.maildummy.io/v1';

beforeEach(() => {
  process.env.MAILDUMMY_API_KEY = 'test-key';
  fetch.mockClear();
});

describe('client', () => {
  it('should use api key from configuration option "apiKey"', async () => {
    const originalKey = process.env.MAILDUMMY_API_KEY;
    process.env.MAILDUMMY_API_KEY = 'should-be-ignored';
    const client = new MaildummyClient({ apiKey: 'test-key' });
    mockFetchResponse({ count: 0, inboxes: [] });

    await client.listInboxes();

    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: { Authorization: 'test-key' },
      })
    );
    process.env.MAILDUMMY_API_KEY = originalKey;
  });

  it('should use api key from environment variable "MAILDUMMY_API_KEY"', async () => {
    const originalKey = process.env.MAILDUMMY_API_KEY;
    process.env.MAILDUMMY_API_KEY = 'test-key';
    const client = new MaildummyClient();
    mockFetchResponse({ count: 0, inboxes: [] });

    await client.listInboxes();

    expect(fetch).toHaveBeenCalledWith(
      new URL(`${baseUrl}/inboxes`),
      expect.objectContaining({
        headers: { Authorization: 'test-key' },
      })
    );

    process.env.MAILDUMMY_API_KEY = originalKey;
  });

  it('should throw when no API key is provided', async () => {
    delete process.env.MAILDUMMY_API_KEY;
    expect.assertions(1);

    try {
      new MaildummyClient();
    } catch (e) {
      expect(e).toHaveProperty(
        'message',
        'No API key provided, please provide the apiKey config option, or set the MAILDUMMY_API_KEY environment variable'
      );
    }
  });

  it('should throw error responses', async () => {
    const client = new MaildummyClient();
    mockFetchResponse({ message: 'Unauthorized' }, 401);
    expect.assertions(3);

    try {
      await client.listInboxes();
    } catch (e) {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        new URL(`${baseUrl}/inboxes`),
        expect.objectContaining({
          headers: { Authorization: 'test-key' },
        })
      );
      expect(e).toHaveProperty('message', expect.stringContaining('401'));
    }
  });

  describe('createInbox', () => {
    it('should return a newly created inbox', async () => {
      const client = new MaildummyClient();
      const now = Date.now();
      mockFetchResponse({ uuid: 'testuuid', address: 'testuuid@maildummy.io', inbox: { created_at: now } });

      const inbox = await client.createInbox();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/inboxes`,
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(inbox).toEqual({ createdAt: now });
    });
  });

  describe('deleteInbox', () => {
    it('should delete an inbox by uuid', async () => {
      const client = new MaildummyClient();
      mockFetchResponse({});

      const isDeleted = await client.deleteInbox('testuuid');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/inboxes/testuuid`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(isDeleted).toBe(true);
    });
  });

  describe('listInboxes', () => {
    it('should list inboxes', async () => {
      const client = new MaildummyClient();
      mockFetchResponse({
        count: 3,
        inboxes: [
          {
            uuid: 'testuuid1',
            address: 'testuuid1@maildummy.io',
            created_at: 123451,
          },
          {
            uuid: 'testuuid2',
            address: 'testuuid2@maildummy.io',
            created_at: 123452,
          },
          {
            uuid: 'testuuid3',
            address: 'testuuid2@maildummy.io',
            created_at: 123452,
          },
        ],
        next_page: 'nextpagetoken',
      });

      const { count, inboxes, nextPageToken } = await client.listInboxes();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(new URL(`${baseUrl}/inboxes`), expect.objectContaining({}));
      expect(count).toEqual(3);
      expect(inboxes).toEqual([
        {
          uuid: 'testuuid1',
          address: 'testuuid1@maildummy.io',
          createdAt: 123451,
        },
        {
          uuid: 'testuuid2',
          address: 'testuuid2@maildummy.io',
          createdAt: 123452,
        },
        {
          uuid: 'testuuid3',
          address: 'testuuid2@maildummy.io',
          createdAt: 123452,
        },
      ]);
      expect(nextPageToken).toBe('nextpagetoken');
    });

    it('should fetch the next page of inboxes', async () => {
      const client = new MaildummyClient();
      mockFetchResponse({
        count: 1,
        inboxes: [
          {
            uuid: 'testuuid4',
            address: 'testuuid4@maildummy.io',
            created_at: 123454,
          },
        ],
        next_page: 'nextpagetoken',
      });

      const { count, inboxes, nextPageToken } = await client.listInboxes('nextpagetoken');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(new URL(`${baseUrl}/inboxes?next_page=nextpagetoken`), expect.objectContaining({}));
      expect(count).toEqual(1);
      expect(inboxes).toEqual([
        {
          uuid: 'testuuid4',
          address: 'testuuid4@maildummy.io',
          createdAt: 123454,
        },
      ]);
      expect(nextPageToken).toBe('nextpagetoken');
    });
  });

  describe('getMail', () => {
    it('should return a mail by uuid', async () => {
      const client = new MaildummyClient();
      mockFetchResponse({
        mail: {
          uuid: 'testuuid',
          date: 123456,
          from: { name: 'testfrom', address: 'from@maildummy.io' },
          to: [{ name: 'testto', address: 'to@maildummy.io' }],
          cc: [{ name: 'testcc', address: 'cc@maildummy.io' }],
          bcc: [{ name: 'testbcc', address: 'bcc@maildummy.io' }],
          subject: 'testsubject',
          content: 'testcontent',
          message_spam_score: 1,
          attachments: ['https://testurl'],
        },
      });

      const result = await client.getMail('testuuid');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/mails/testuuid`, expect.objectContaining({}));
      expect(result).toEqual({
        uuid: 'testuuid',
        date: 123456,
        from: { name: 'testfrom', address: 'from@maildummy.io' },
        to: [{ name: 'testto', address: 'to@maildummy.io' }],
        cc: [{ name: 'testcc', address: 'cc@maildummy.io' }],
        bcc: [{ name: 'testbcc', address: 'bcc@maildummy.io' }],
        subject: 'testsubject',
        content: 'testcontent',
        attachments: ['https://testurl'],
      });
    });
  });

  describe('deleteMail', () => {
    it('should delete an email by uuid', async () => {
      const client = new MaildummyClient();
      mockFetchResponse({});

      const isDeleted = await client.deleteMail('testuuid');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/mails/testuuid`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(isDeleted).toBe(true);
    });
  });

  describe('listMails', () => {
    it('should list mails', async () => {
      const client = new MaildummyClient();
      mockFetchResponse({
        count: 2,
        mails: [
          {
            uuid: 'testuuid1',
            from: 'from@maildummy.io',
            recipient: 'recipient@maildummy.io',
            subject: 'testsubject',
            created_at: 123451,
          },
          {
            uuid: 'testuuid2',
            from: 'from@maildummy.io',
            recipient: 'recipient@maildummy.io',
            subject: 'testsubject',
            created_at: 123452,
          },
        ],
        next_page: 'nextpagetoken',
      });

      const { count, mails, nextPageToken } = await client.listMails('testuuid');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(new URL(`${baseUrl}/mails/inbox/testuuid`), expect.objectContaining({}));
      expect(count).toEqual(2);
      expect(mails).toEqual([
        {
          uuid: 'testuuid1',
          from: 'from@maildummy.io',
          recipient: 'recipient@maildummy.io',
          subject: 'testsubject',
          createdAt: 123451,
        },
        {
          uuid: 'testuuid2',
          from: 'from@maildummy.io',
          recipient: 'recipient@maildummy.io',
          subject: 'testsubject',
          createdAt: 123452,
        },
      ]);
      expect(nextPageToken).toBe('nextpagetoken');
    });

    it('should fetch the next page of mails', async () => {
      const client = new MaildummyClient();
      mockFetchResponse({
        count: 1,
        mails: [
          {
            uuid: 'testuuid3',
            from: 'from@maildummy.io',
            recipient: 'recipient@maildummy.io',
            subject: 'testsubject',
            created_at: 123453,
          },
        ],
        next_page: 'nextpagetoken',
      });

      const { count, mails, nextPageToken } = await client.listMails('testuuid', 'nextpagetoken');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(new URL(`${baseUrl}/mails/inbox/testuuid?next_page=nextpagetoken`), expect.objectContaining({}));
      expect(count).toEqual(1);
      expect(mails).toEqual([
        {
          uuid: 'testuuid3',
          from: 'from@maildummy.io',
          recipient: 'recipient@maildummy.io',
          subject: 'testsubject',
          createdAt: 123453,
        },
      ]);
      expect(nextPageToken).toBe('nextpagetoken');
    });
  });

  describe('waitForNewMails', () => {
    it('should return new mails which were not returned before', async () => {
      fetch.mockImplementation(() => new Response(JSON.stringify({ data: { count: 0, mails: [] } }), { status: 200 }));

      // For all intermittent calls, return empty mails
      const client = new MaildummyClient();
      const listMailsSpy = jest.spyOn(client, 'listMails');
      listMailsSpy.mockResolvedValue({
        count: 0,
        mails: [],
      });
      listMailsSpy.mockResolvedValueOnce({
        count: 2,
        mails: [
          {
            uuid: 'testuuid2',
          } as MailMetadata,
          {
            uuid: 'testuuid1',
          } as MailMetadata,
        ],
      });
      // to prepare, fetch some mails mocked above
      await client.waitForNewMails('testuuid');

      // Trigger the new mail asynchronously
      setTimeout(() => {
        listMailsSpy.mockResolvedValueOnce({
          count: 1,
          mails: [
            {
              uuid: 'testuuid3',
              from: 'from@maildummy.io',
              recipient: 'recipient@maildummy.io',
              subject: 'testsubject',
              createdAt: 123453,
            },
            {
              uuid: 'testuuid2',
            } as MailMetadata,
            {
              uuid: 'testuuid1',
            } as MailMetadata,
          ],
        });
      }, 2000);

      const mails = await client.waitForNewMails('testuuid');

      expect(listMailsSpy).toHaveBeenCalledWith('testuuid');
      // Only the last mail should be returned
      expect(mails).toEqual([
        {
          uuid: 'testuuid3',
          from: 'from@maildummy.io',
          recipient: 'recipient@maildummy.io',
          subject: 'testsubject',
          createdAt: 123453,
        },
      ]);
    });

    it('should also return next page of new mails when more than 1 page is available', async () => {
      fetch.mockImplementation(() => new Response(JSON.stringify({ data: { count: 0, mails: [] } }), { status: 200 }));

      // For all intermittent calls, return empty mails
      const client = new MaildummyClient();
      const listMailsSpy = jest.spyOn(client, 'listMails');

      listMailsSpy.mockResolvedValue({
        count: 0,
        mails: [],
      });
      listMailsSpy.mockResolvedValueOnce({
        count: 2,
        mails: [
          {
            uuid: 'testuuid2',
          } as MailMetadata,
          {
            uuid: 'testuuid1',
          } as MailMetadata,
        ],
      });
      // to prepare, fetch some mails mocked above
      await client.waitForNewMails('testuuid');

      // Trigger the new mail asynchronously
      setTimeout(() => {
        // we will generate several pages of results

        // mails 46 through 27
        listMailsSpy.mockResolvedValueOnce({
          count: 20,
          mails: Array.from(
            { length: 20 },
            (_, i) =>
              ({
                uuid: `testuuid${46 - i}`,
              } as MailMetadata)
          ),
          nextPageToken: 'nextpagetoken',
        });
        // mails 26 through 7
        listMailsSpy.mockResolvedValueOnce({
          count: 20,
          mails: Array.from(
            { length: 20 },
            (_, i) =>
              ({
                uuid: `testuuid${26 - i}`,
              } as MailMetadata)
          ),
          nextPageToken: 'nextpagetoken',
        });

        // mails 6 through 1
        listMailsSpy.mockResolvedValueOnce({
          count: 20,
          mails: Array.from(
            { length: 6 },
            (_, i) =>
              ({
                uuid: `testuuid${6 - i}`,
              } as MailMetadata)
          ),
        });
      }, 2000);

      const mails = await client.waitForNewMails('testuuid');

      expect(listMailsSpy).toHaveBeenCalledWith('testuuid');
      expect(listMailsSpy).toHaveBeenCalledWith('testuuid', 'nextpagetoken');

      // Only the last 44 mails should be returned
      expect(mails).toEqual(
        Array.from(
          { length: 44 },
          (_, i) =>
            ({
              uuid: `testuuid${46 - i}`,
            } as MailMetadata)
        )
      );
    });

    it('should timeout when no new mails are received', async () => {
      fetch.mockImplementation(() => new Response(JSON.stringify({ data: { count: 0, mails: [] } }), { status: 200 }));

      // For all intermittent calls, return empty mails
      const client = new MaildummyClient();
      const listMailsSpy = jest.spyOn(client, 'listMails');
      listMailsSpy.mockResolvedValue({
        count: 0,
        mails: [],
      });

      expect.assertions(1);

      try {
        await client.waitForNewMails('testuuid', 3);
      } catch (e) {
        expect(e).toHaveProperty('message', 'No mails found within timeout of 3 seconds');
      }
    });
  });
});
