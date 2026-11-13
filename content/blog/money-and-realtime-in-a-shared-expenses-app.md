---
title: The balances table I deleted
date: 2026-11-09
summary: In Tally Stick, a balance is never stored. It's a sum over a ledger Postgres won't let anyone edit, so a fix is a reversal plus a new version, and phones refetch instead of trusting socket payloads.
tags: [NestJS, PostgreSQL, React Native]
draft: false
cover: ledger
---

Tally Stick is a shared-expenses app I've been building on my own since August 2026. It was called Hissab until November 2026. It's built with React Native and Expo on the phone, NestJS and PostgreSQL behind it. You record who paid for dinner and who owes what, and settle up later. Tally Stick never moves money. Settlements happen outside the app, in cash or by bank transfer, and Tally Stick records them.

This post is about one decision: balances are never stored, only summed from history. It started with a table I designed on day one and deleted eight days later, and it shaped how edits and realtime updates work.

## Money is a bigint

Every amount is an integer count of the smallest unit, stored in a Postgres `bigint`. `1250` is 12.50. The columns are named for it (`total_minor`, `amount_minor`, `owed_minor`), and `CHECK` constraints reject an expense total, payment or split share that isn't positive. Ledger postings are the signed side: each person's posting is what they paid minus what they owe, so it can be negative. The API takes amounts as strings and rejects anything that isn't a whole number or won't fit in 64 bits, so a float never gets near the database.

Integers raise one question floats let you ignore: split 10.00 three ways, which is 1000 in minor units, and you get 333 + 333 + 333 = 999. Someone has to take the extra unit, and the phone's preview has to pick the same person the server does. Here's the rule:

```ts
// participant ids are sorted first, so the order is the same everywhere
const base = totalMinor / BigInt(userIds.length);
const remainder = Number(totalMinor % BigInt(userIds.length));
const amountMinor = base + (index < remainder ? 1n : 0n);
```

The app runs the same maths for its preview, and a reconcile script checks every stored split against this rule in SQL. There's a [field note](/field-notes#who-gets-the-leftover-cent) on why the sort matters.

## I deleted the balances table

My first schema had a `balance_projections` table: one row per person, per group, per currency, holding their net balance and the last event that touched it.

```sql
CREATE TABLE "balance_projections" (
  "ledger_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "currency" char(3) NOT NULL,
  "net_minor" bigint DEFAULT 0 NOT NULL,
  "last_financial_event_id" uuid NOT NULL,
  ...
);
```

It's the obvious design. Reading a balance is one row, and the home screen is mostly balances. But it means every expense, edit, delete and settlement has to update two things in step: the history and the running total. Any path that forgets the second one leaves a balance that no longer matches the expenses behind it, and nothing tells you.

Migration `0009_currency_neutral_model` removed it, along with every per-row currency column. Tally Stick doesn't record a denomination at all. An amount is a plain integer, and the people in a group are expected to count in the currency they'll settle in. The currency setting only picks the symbol on your own screen. That's a limitation: if one friend picks PKR and another picks USD, they see the same number with different symbols, and the app can't tell them they disagree. Supporting mixed currencies properly would mean storing a currency on every amount and deciding where exchange rates come from, and Tally Stick deliberately does neither.

Dropping currency took out the projection's primary key, and rather than rebuild it, I deleted the table. A balance is now a sum:

```sql
SELECT posting.user_id, sum(posting.amount_minor) AS net_minor
FROM financial_events event
JOIN ledger_postings posting ON posting.financial_event_id = event.id
WHERE event.ledger_id = $1::uuid
GROUP BY posting.user_id
```

There is nothing to keep in sync, because there is only one copy. When someone asks why they owe 3,200, the answer is the list of postings that add up to it.

## The database won't let me edit history

If balances come from history, history has to stay put. In Tally Stick that's enforced by Postgres, not by convention. A trigger, `reject_append_only_mutation()`, blocks every `UPDATE` and `DELETE` on the money tables: financial events, ledger postings, expenses, payments and splits.

So how do you fix a typo in an expense? You don't edit it. An edit inserts a new version of the expense (`replaces_expense_id`, `version + 1`) plus a `REVERSAL` event that posts the exact negative of the old amounts. A delete works the same way and leaves a marker row behind. The database also checks that each event's postings sum to zero, and that the payers and the splits both add up to the expense total.

Three edge cases showed up once the rule was in place:

- **Undoing an undo.** A reversal is just another event, so nothing stopped one reversal from pointing at another. A second trigger now refuses that ([field note](/field-notes#reversing-a-reversal)).
- **Two people editing the same expense.** Every edit has to send the version it started from. If someone else saved first, the API answers "Expense version conflict" instead of quietly replacing it.
- **Double taps on a bad connection.** Each save carries an idempotency key, so tapping Save twice on a slow network records one expense, not two.

Even deleting an account leaves history alone. Tally Stick won't delete an account while any balance is non-zero. When you do delete, your email is cleared and your name becomes "Deleted user", but the ledger rows stay, because they reference you with `onDelete: 'restrict'`. Your friends' balances still add up after you've gone.

## Realtime: an outbox, then "go refetch"

When I add an expense, everyone in the group should see it without pulling to refresh. The naive version is to emit a socket event right after saving. That breaks in two directions. Emit before the commit and a phone can show an expense that then fails to save. Emit after it and a crash in between means nobody hears about it.

Tally Stick uses a transactional outbox instead:

1. The money change, an activity row and an outbox row are saved in **one transaction**. Either all three exist or none do.
2. A worker claims a batch of rows with `FOR UPDATE SKIP LOCKED` and a five-minute lease, so two workers don't pick up the same row at once. A failed delivery retries with backoff, from 5 seconds up to 15 minutes, and stops after 10 attempts.
3. Delivery calls `pg_notify` inside a transaction, so the signal fires only on commit. The Socket.IO gateway turns it into an `invalidate` for each affected user.

The event names what changed and where, but the phone ignores even that:

```ts
const refetchAuthoritativeState = () => void queryClient.invalidateQueries();
socket.on('connect', refetchAuthoritativeState);
socket.on('invalidate', refetchAuthoritativeState);
socket.on('resync', refetchAuthoritativeState);
AppState.addEventListener('change', (state) => {
  if (state === 'active') refetchAuthoritativeState();
});
```

The socket never carries balances or expenses, only a hint that something changed. The phone asks the API again, and the API reads the database. Because the phone never applies a payload, a duplicate or out-of-order event costs one extra refetch, not a wrong balance.

## What happens when a phone misses an event

It's tempting to say this keeps every phone consistent even when an event is missed. It doesn't, quite. There is no replay: no sequence numbers, no "give me everything since event 41". If an `invalidate` is sent while a phone's socket is down, that event is gone.

What actually covers the gap is the code above. Three things trigger a full refetch:

- **Reconnecting.** `connect` fires on every reconnect, not just the first.
- **Coming back to the foreground.** Phones suspend backgrounded apps, so the socket is usually dead by the time you open Tally Stick again. Opening it refetches everything.
- **A server-side `resync`.** If the server loses its database listener, it tells every socket to refetch and drops them.

That's enough for an app you open, glance at and close. There's one hole I know about: when the server drops a socket on purpose, Socket.IO doesn't reconnect by itself, and I don't handle `disconnect` yet. A phone that stays open in the foreground could sit on stale data until the next time it's backgrounded. That's the next fix.
