---
title: A reversal that reversed a reversal
date: 2026-08-04
tags: [Tally Stick, PostgreSQL]
draft: false
---

**Problem:** in Tally Stick, editing or deleting an expense posts a `REVERSAL` that cancels the old amounts. Nothing stopped someone from reversing the reversal.

**Cause:** a reversal is just another event, so one could point at another, and an undo-of-undo could quietly bring back a debt that had already been cancelled.

**Fix:** a trigger rejects any reversal whose target is a reversal. Corrections go forward as a new version of the expense.

```sql
IF NEW.event_type = 'REVERSAL' AND EXISTS (
  SELECT 1 FROM financial_events reversed
  WHERE reversed.id = NEW.reverses_event_id
    AND reversed.event_type = 'REVERSAL'
) THEN
  RAISE EXCEPTION 'A reversal event cannot reverse another reversal';
END IF;
```
