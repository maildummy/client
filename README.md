<h1 align="center">
   <b>
        <a href="https://maildummy.io"><img width="300" src="https://dev.maildummy.io/static/full-web-606c45659231f9fe5e827999b181eb0d.svg" /></a><br>
    </b>
</h1>

<p align="center">End-to-end email testing for free.</p>

<div align="center">

[![npm version](https://img.shields.io/npm/v/@maildummy/client.svg?style=flat-square)](https://www.npmjs.org/package/@maildummy/client)
[![Build status](https://img.shields.io/github/workflow/status/maildummy/client/Release/main?label=CI&logo=github&style=flat-square)](https://github.com/maildummy/client/actions/workflows/release.yml)
[![Coverage Status](https://coveralls.io/repos/github/maildummy/client/badge.svg?branch=main)](https://coveralls.io/github/maildummy/client?branch=main)
[![install size](https://packagephobia.com/badge?p=@maildummy/client)](https://packagephobia.com/result?p=@maildummy/client)
[![Known Vulnerabilities](https://snyk.io/test/npm/@maildummy/client/badge.svg)](https://snyk.io/test/npm/@maildummy/client)

</div>


# [Maildummy client](https://maildummy.io/)
Integrate real email messages in your (e2e) tests quickly and free.  
[Read more here](https://maildummy.io/docs), or [sign up](https://maildummy.io/sign-up/) to get started.

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

### Puppeteer (with jest)
Example account sign up test using [jest-puppeteer](https://jestjs.io/docs/puppeteer).

``` ts
import { MaildummyClient, Inbox, Mail } from '@maildummy/client';
import { config } from '../config';

describe('Create account', () => {
  let inbox: Inbox;
  let confirmationMail: Mail;

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

  it('should receive the confirmation email', async () => {
    await page.goto(`${config.url}/sign-up`);

    // fill and submit the form
    await page.waitForSelector('[name=fullname]');
    await page.type('[name=fullname]', 'test user');
    await page.waitForSelector('[name=email]');
    await page.type('[name=email]', inbox.address);
    await page.waitForSelector('[type=submit]');
    await page.click('[type=submit]');

    // wait for the signup email to arrive
    const newMails = await md.waitForNewMails(inbox.uuid);
    expect(newMails).toHaveLength(1);
    const metaData = newMails[0];
    expect(metaData.from).toEqual(config.sendmail.fromAddress);
    expect(metaData.subject).toEqual('You have signed up!');

    // to assert the contents, the mail object needs to be fetched
    confirmationMail = await md.getMail(newMails[0].uuid);
    expect(confirmationMail.content).toContain('<h1>Welcome test user,</h1>');
  });

  it('should be able to confirm the email address', async () => {
    expect(confirmationMail).toBeDefined();

    // render the mail html and open the confirmation link
    page.setContent(confirmationMail.content);
    await page.waitForSelector('a');
    const linkText = await page.$eval('a', (el) => (el as HTMLElement).innerText);
    expect(linkText).toContain('confirm email');
    await page.click('a');

    // assert that the email address has been confirmed
    await page.waitForSelector('h1');
    const title = await page.$eval('h1', (el) => (el as HTMLElement).innerText);
    expect(title).toContain('has been confirmed');
  });
});

```

### Cypress
Example account sign up test using [Cypress](https://www.cypress.io/).
``` ts
import { MaildummyClient, Inbox, Mail, List, MailMetadata } from '@maildummy/client';
import { config } from '../../config';

describe('Sign up', () => {
  let inbox: Inbox;
  let confirmationMail: Mail;

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

  it('Should receive the confirmation email', () => {
    cy.visit('/sign-up');

    // fill and submit the form
    cy.get('input[name="fullname"]').type('test user').should('have.value', 'test user');
    cy.get('input[name="email"]').type(inbox.address).should('have.value', inbox.address);
    cy.get('form#signUp').submit();

    // wait for the signup email to arrive, provide a larger timeout to cypress to allow the email to be sent
    cy.wrap(md.waitForNewMails(inbox.uuid), { timeout: 10000 }).then((newMails: List<MailMetadata>) => {
      expect(newMails).to.have.length(1);

      // assert the mail metadata
      const metaData = newMails[0];
      expect(metaData.from).to.eql(config.sendmail.fromAddress);
      expect(metaData.subject).to.eql('You have signed up!');

      // to assert the contents, the mail object needs to be fetched
      cy.wrap(md.getMail(metaData.uuid)).then((mail: Mail) => {
        confirmationMail = mail;
        expect(confirmationMail.content).to.contain('<h1>Welcome test user,</h1>');
      });
    });
  });

  it('Should be able to confirm the email address', () => {
    expect(confirmationMail).to.not.be.undefined;

    // evaluate the mail html and open the confirmation url
    const $a = Cypress.$(confirmationMail.content).find('a');
    expect($a.text()).to.contain('confirm email');
    cy.visit($a.attr('href'));

    // assert that the email address has been confirmed
    cy.get('h1').should('contain', 'has been confirmed');
  });
});

```

## Documentation
See [https://maildummy.io/docs](https://maildummy.io/docs).
