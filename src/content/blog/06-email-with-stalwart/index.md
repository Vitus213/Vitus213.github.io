---
title: "My One Place Solution for Email"
description: "不同的邮箱导致要配十万个客户端，我的解决方案是自建！"
date: "Dec 27 2025"
---

## Issue

Nowadays people have multiple different platform email. Google,
Outlook, and sometimes organisations make even more. So, with that
many emails, config your client in one place is a simple wish but
frustrating to do so. You can easily waste an hour to make your
new device connect to all your email - and sometimes you miss one.

So annoying! So I decided to make a solution. Obviously I won't
hand out my private work and school email to the big G. Here are
the requirements:

1. It should be abled to receive all of the emails from different
platform
2. Can also allow me to send all of the email in one place

Normally there are two ways to achieve that.

One is simply setting up a web email client. Grab all your IMAP/SMTP
account to one place, and sync email from all other platforms.

The other one is a bit complicated, and actually not that obvious
compare to the web email client solution. Instead of setting up the IMAP,
I choose to host my own email server, setup other emails forwarding,
and use SMTP relay for sending emails.

I choose the later one. To be clear, that just because I found that my home
network LSP didn't block my 25 port. (And having your own email
server is waaaay cooler than a web email client isn't it?)

## Implementation

I won't talk about too much technical detail here, because you just
need to ask your GPT.

I choose stalwart as my solution, and host it on my PVE. It is written
in Rust, and provides a nice and neat GUI, taking so little resource on
your machine, compare to Mailu.
Checkout its document: https://stalw.art/docs/

Stalwart provides JMAP for your client, but since I've config a VLESS
reality server on 443, I didn't want to spend time on multiplexing my
existing VLESS config (but possible! Actually I can config it to proxy
specific domain's connection to my email server, but IMAP is enough
for me).

So after your stalwart installation, you can just use its control panel
for all the rest of the configuration.

### Setup a Functional Email Server

First we need to make it a functional email server. Typically it means
you need a dedicate domain and setup all the DNS records. Stalwart provides
an easy way to config it.

1. You'll need a domain with resolve record point to your server IP. In
my case, I use `mail.samuka007.com` for resolving. That is just a record
so you can specify `something.sub10086.randomdomain.xyz` as long as you can
config it.
2. Go to stalwart settings and paste your formally set domain to the _Server-
Network-Hostname_ setting.
3. Go to _Management-Directory-Domains_, add your actual use domain. In my
case, `samuka007.com`. Click _Save & Reload_
4. After adding the domain, you can click on the dot and _View DNS records_.
Copy the _Zonefile_, paste it to a txt, and upload to your DNS resolve provider
(like Cloudflare).
5. Don't forget to expose neccessary ports on public internet. You can check
the list in _Settings-Server-Listeners_.
6. Also check your delivery ablility. Click on your newly set domain's three
dots, _"Test Email Delivery"_, and click start. In my configuration, besides
the `TLSA` record and the `MTA-STA` policy fetch (which need http explosure),
I got them all pass. If you have problems on it, just ask GPT.

After that, setup your first account with the very first email of your domain.
Now you should be able to send and receive message from others.

### Make your Emails All-in-One

Let's start an example like configuring your SCUT school email. The SCUT
anti-spam function sucks, even worse than the default settings of stalwart,
not to mention you can easily integrate AI, even LLM functionbility on
stalwart. So, here is the brief introduction.

1. Setup and activate your SCUT email forwarding.
2. Get SMTP server info and password.
3. Go to _Directory-Domains_ and add `mail.scut.edu.cn`
4. Go to _Settings-SMTP-Outbound_, add _Routing_ with id `scut-01`,
select Type `Relay Host`, enter Server Details and Authentication.
5. Go to _Strategies_, _Add Condition_ under _Outbound Strategies-Routing_,
and set if=`sender == '<your email address>'`, then=`'scut-01'`.
6. Click _Save & Reload_

Now you can go to the Accounts panel and add your SCUT mail to  _Aliases_.

### Setup your Endpoint Email Client

I choose Fairmail on my Android device. Set it up like you add other platform
with IMAP and SMTP. After adding your main mail, you can immediately receive
all other mail forwarded by other platforms. If you want to send emails on
behave of your SCUT mail, just add an alias, which is just follow the instruction,
copy the account config and edit the mail address.

On MacOS, just Mail. On my NixOS, I setup `imapnotify` service to trigger mail
receive notification. The code is like
```nix
accounts.email.accounts."name".imapnotify = {
  enable = true;
  onNotify = "${pkgs.isync}/bin/mbsync Samuka007";
  onNotifyPost = ''
    ${pkgs.notmuch}/bin/notmuch new

    INFO=$(${pkgs.notmuch}/bin/notmuch search --limit=1 --format=json tag:unread | ${pkgs.jq}/bin/jq -r '.[0]')

    if [ "$INFO" != "null" ]; then
      SENDER=$(echo "$INFO" | ${pkgs.jq}/bin/jq -r '.authors')
      SUBJECT=$(echo "$INFO" | ${pkgs.jq}/bin/jq -r '.subject')

      ${pkgs.libnotify}/bin/notify-send "New Email: $SENDER" "$SUBJECT"
    fi
  '';
};
```
