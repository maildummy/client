# [Maildummy client](https://maildummy.io/)
Integrate real email messages in your test workflows quickly and free. [Read more here](https://maildummy.io/docs), or [sign up](https://maildummy.io/sign-up/) to get started.

## Getting Started

Create an API key at the [settings page](https://maildummy.io/settings).

Install the client using [`yarn`](https://yarnpkg.com/en/package/@maildummy/client):

```bash
yarn add --dev @maildummy/client
```

Or [`npm`](https://www.npmjs.com/package/@maildummy/client):

```bash
npm install --save-dev @maildummy/client
```

## Usage

### Jest
Example account sign up test using [jest](https://jestjs.io/).
``` ts
import { MaildummyClient, Inbox } from '@maildummy/client';
import { config } from '../config';
import { signUp, Account } from './account.util';

describe('Account util', () => {
  let inbox: Inbox;

  // provide the apiKey in the options, or set the environment variable MAILDUMMY_API_KEY
  const md = new MaildummyClient({ apiKey: config.maildummy.apiKey });

  beforeAll(async () => {
    // create a single inbox for all tests in this file
    inbox = await md.createInbox();
    expect(inbox.uuid).toBeDefined();
  });

  afterAll(async () => {
    // deleting the inbox makes sure no more emails are received
    await md.deleteInbox(inbox.uuid);
  });

  it('Should receive the welcome email', async () => {
    // prepare a new account
    const account: Account = {
      fullName: 'test user',
      email: inbox.address,
    };

    // execute the signup
    await signUp(account);

    // wait for the signup email to arrive
    const newMails = await md.waitForNewMails(inbox.uuid);

    // assert the mail metadata
    expect(newMails).toHaveLength(1);
    const metaData = newMails[0];
    expect(metaData.from).toEqual(config.sendmail.fromAddress);
    expect(metaData.subject).toEqual('You have signed up!');

    // to assert the contents, the details need to be fetched first
    const mail = await md.getMail(metaData.uuid);
    expect(mail.content).toContain(`<h1>Welcome ${account.fullName},</h1>`);
    expect(mail.attachments).toHaveLength(2);
  });
});

```

### Cypress
Example account sign up test using [Cypress](https://www.cypress.io/).
``` ts
import { MaildummyClient, Inbox } from '@maildummy/client';
import { config } from '../config';

describe('Sign up', () => {
  let inbox: Inbox;

  // provide the apiKey in the options, or set the environment variable MAILDUMMY_API_KEY
  const md = new MaildummyClient({ apiKey: config.maildummy.apiKey });

  before(async () => {
    // create a single inbox for all tests in this file
    inbox = await md.createInbox();
    expect(inbox.uuid).to.not.be.undefined;
  });

  after(async () => {
    // deleting the inbox makes sure no more emails are received
    await md.deleteInbox(inbox.uuid);
  });

  it('Should receive the welcome email', async () => {
    cy.visit('https://example.cypress.io/sign-up');

    // fille and submit the form
    cy.get('input[name="fullname"]').type('test user').should('have.value', 'test user');
    cy.get('input[name="email"]').type(inbox.address).should('have.value', inbox.address);
    cy.get('form#signUp').submit();

    // wait for the signup email to arrive
    const newMails = await md.waitForNewMails(inbox.uuid);

    // assert the mail metadata
    expect(newMails).to.have.length(1);
    const metaData = newMails[0];
    expect(metaData.from).to.eql(config.sendmail.fromAddress);
    expect(metaData.subject).to.eql('You have signed up!');

    // to assert the contents, the details need to be fetched first
    const mail = await md.getMail(metaData.uuid);
    expect(mail.content).to.contain('<h1>Welcome test user,</h1>');
    expect(mail.attachments).to.have.length(2);
  });
});
```

## Documentation
See [https://maildummy.io/docs](https://maildummy.io/docs).