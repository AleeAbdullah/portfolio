---
title: Proposal totals ran over the PDF footer
date: 2026-10-21
tags: [React PDF, Ripeseed]
draft: false
---

**Problem:** on some roofing proposals, the totals block ran over the PDF footer and left a blank page after it.

**Cause:** in `@react-pdf/renderer`, the totals sat in a table `View` that was allowed to wrap, so near a page end the layout split it across the break.

**Fix:** line-item rows keep `wrap={false}` so no row is cut in half, and the totals table doesn't wrap at all. It moves to the next page whole.

```tsx
<View style={styles.table} wrap={!isTotals}>
```
