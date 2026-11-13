---
title: A sync pull could overwrite an offline edit
date: 2026-10-04
tags: [FitKraft, SQLite, Sync]
draft: false
---

**Problem:** FitKraft saves changes to SQLite and queues them for upload. A background pull that landed first would replace the newer local row with the older server copy.

**Cause:** pulled rows overwrite local ones, which is wrong only for a row the phone has changed and not uploaded yet.

**Fix:** skip any pulled row with a queued or in-flight change. The local copy wins when the queue drains.

```ts
if (queuedIds(db, entity).has(row.id)) return; // local copy is newer
```
