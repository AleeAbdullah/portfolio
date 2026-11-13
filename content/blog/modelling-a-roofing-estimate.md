---
title: A proposal can hide a number, but never change it
date: 2026-11-02
summary: At Ripeseed, every amount on a roofing proposal comes from one Django function, and the pages can only group or hide numbers. Each percentage is stored with its profit type, so a 20% margin and a 20% markup never get confused, and replacing the pricing model meant changing one function.
tags: [Django, React PDF, Money]
draft: false
cover: roof
---

At Ripeseed I work on a platform that roofing contractors use to price jobs, built for Brava Roof Tile, a US roofing tile manufacturer. A contractor measures a roof, the platform works out the materials, suppliers price that list, and the contractor sends the homeowner a proposal.

That proposal is my part. Through October 2026 I rebuilt how proposals work: the proposal editor contractors use, in Next.js, the PDF in `@react-pdf/renderer`, and the money behind both in Django. This post is about the money, because that's where a proposal can go wrong in front of a homeowner.

## The problem: every page wants its own total

Contractors want control over how a proposal looks. Some show every line with a price. Some group shingles, underlayment and ridge cap under one "Roofing system" line. Some hide accessory prices and show a single total. Some quote a rate per square, the unit roofers price in (100 square feet).

Each of those options is a different place the numbers could be worked out, and every place a number is worked out is a place it can disagree with another one. The worst version is a PDF whose total doesn't match the sum of its own lines, sent to a homeowner who checks it with a calculator.

## One function owns the money

So there is exactly one place amounts are calculated. The first line of the module says what it's for:

```python
"""The proposal's money, worked out once.
Presentation (pricing blocks) can group or hide amounts, never change them."""
```

`build_ledger()` takes the project, meaning the materials, accessories, the chosen supplier pricing, charges, freight, tax and the contractor's profit, and returns every amount the proposal will show. The pricing blocks on the page get that result. They can group rows under a shared name, hide a row's amount, or show a subtotal. They can't do arithmetic.

That rule paid off on October 29, when I added grouping pricing categories under one name in the totals. The change touched the code that lays out the pricing blocks and its tests, and not the ledger, so the total couldn't drift.

Some smaller rules live in the same module:

- **Customer copy only.** A line shows the product's catalogue description, cut at 80 characters on a word boundary. A line's own notes are the contractor's working, and they never reach the homeowner.
- **No silent zeros.** A rate per square on a roof with no measured area raises an error instead of pricing the job at nothing.
- **Show the measured area.** The ledger prices squares with waste added, so they're bigger than the roof. These are unrounded squares, not bundles, so dividing the waste back out is exact: `squares × 100 ÷ (100 + waste)`. 33 squares at 10% waste is 30 squares of roof.

## Margin is not markup

Contractors set their profit as a percentage, and "20%" means two different things depending on who you ask.

```python
def apply_profit(cost, percent, profit_type):
    rate = to_decimal(percent) / 100
    if profit_type == PricingProfitTypeEnum.MARGIN:
        return to_decimal(cost) / (1 - rate)
    return to_decimal(cost) * (1 + rate)
```

On a $10,000 job, a 20% **markup** is $12,000: cost plus 20% of cost. A 20% **margin** is $12,500, because the profit has to be 20% of the *price*.

| Cost | Profit setting | Price | Profit | Profit as % of price |
| --- | --- | --- | --- | --- |
| $10,000 | 20% markup | $12,000 | $2,000 | 16.7% |
| $10,000 | 20% margin | $12,500 | $2,500 | 20% |

 That's $500 apart on one job, from the same number typed into the same box. So the profit type is stored next to the percentage, and the ledger never guesses.

## The pricing model I threw away

The first version gave each proposal one `pricing_method`: `cost_plus` (the priced lines plus profit) or `per_square` (one rate times the roof's squares). It looked simple, but a proposal could only be one or the other. It couldn't put a flat amount and a per-square rate on the same page.

On October 22 I replaced the method and its `per_square_rate` field with a list of `amounts`. Each row is either `{label, amount}` or `{label, rate}`, and a rate is multiplied by the roof's squares. When a proposal has amounts, they replace the line total. The material lines stay on the proposal as scope, without prices, and freight, charges and tax still apply on top. The totals block renders one row per amount.

It was a bigger change than it sounds, because "the total" stopped being one formula. It stayed manageable because the formula lived in one function, so there was one place to change and test.

## What gets frozen, and what doesn't

A proposal sent last Tuesday has to say what it said last Tuesday. Three choices keep it that way:

- **Supplier pricing is pinned.** Suppliers can send several versions of their prices for the same quote. A proposal points at one version, and the API rejects a version from another quote: "Pricing version does not belong to this quote."
- **The proposal keeps its own copy.** Each proposal stores its document, its pricing and its grand total. Duplicating one copies those saved values. It doesn't recompute from today's prices.
- **Templates forget the customer.** A contractor can save a proposal as a template for the next job. Saving resets the homeowner's name, the project address, the proposal date and the install date, drops the product, and keeps the structure and the copy.

## Then the PDF

The PDF had one bug worth a note. Near a page end, the totals block could run over the footer and leave a blank page behind it, because the layout was allowed to split the block across the break. The fix was one prop. There's a [field note](/field-notes#proposal-totals-overlapped-the-footer) on it.
