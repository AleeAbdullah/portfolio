---
title: Who gets the leftover cent?
date: 2026-08-04
tags: [Tally Stick, Money]
draft: false
---

**Problem:** 10.00 is 1000 in minor units, and split three ways that's 333 three times, one short. The phone previews the split and the server saves it, so both must give the extra unit to the same person.

**Cause:** "the first person in the list" depends on the list, and the order people were tapped in isn't one the server knows.

**Fix:** sort the participant IDs, then give one extra unit to each of the first `remainder` people, with the same rule in the app and the API.

```ts
const userIds = [...new Set(participantIds)].sort();
const base = totalMinor / BigInt(userIds.length);
const remainder = Number(totalMinor % BigInt(userIds.length));
const amountMinor = base + (index < remainder ? 1n : 0n);
```
