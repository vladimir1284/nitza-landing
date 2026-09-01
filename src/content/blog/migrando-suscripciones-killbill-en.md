---
title: "Killbill's Recipe vs. the Real Kitchen: Migrating Subscriptions Without Shutting Down the Restaurant"
description: "How we migrated a client's legacy subscription engine to Killbill with zero downtime: a cold cutover instead of the incremental migration the docs recommend, the BigCommerce and Braintree integration, and the partial-payment problem Killbill couldn't solve alone."
pubDate: 2026-08-31
lang: "en"
category: "Nota de Cata"
categorySlug: "nota-de-cata"
readingTime: 8
---

![Professional kitchen mid-service, with the team working across stations](https://blog-media.ladetec.com/nitza-develop/migrando-suscripciones-killbill/migrando-suscripciones-killbill-1.webp)

Before this project, the team had already run into this: building a subscription engine from scratch for a client in the trailer rental business. Creating the order and charging it automatically every cycle was, as expected, the easy part. The real problems showed up afterward: early cancellations mid-contract, plan changes that didn't fit cleanly into a billing cycle already underway, late payments that had to be chased down one by one. The real-world scenario of a subscription business, not the ideal case from a demo.

Designing the menu for a subscription business is the easy part: you define the dish, set the price, and the system charges the same amount every month without anyone having to remember. Any platform handles that without drama. What separates a kitchen that can survive a packed Friday night service from one that collapses at the first complication is everything that happens after the order has already gone out — exactly what the team had already learned the hard way with that trailer rental client. That's where the real complexity of billing subscriptions lives, and that's where almost nobody looks before they start building.

That experience was what led the team not to repeat, in this migration project, the path of cooking up a subscription engine from scratch again. The bet was [Killbill](https://killbill.io): an open-source, self-hosted billing and subscriptions engine that already ships with the product and plan catalog worked out, the full subscription lifecycle (signup, renewal, upgrade, downgrade, pause, cancellation), invoicing, and the payment engine. There was no need to reinvent that recipe — what was needed was to adapt it to this particular kitchen: a client who was already billing in production and couldn't afford to shut down service just to switch chefs.

Killbill ships with a well thought-out official migration guide. The plan it proposes is cautious: move accounts over to the new platform one at a time, each with its own cutover date (`cutOverDate`), while the legacy system keeps billing, in parallel, the accounts that haven't migrated yet. It's, literally, swapping out the pantry's ingredients one by one while the restaurant keeps serving off the old recipe.

For this client, that recipe didn't apply. The business model couldn't tolerate having two cash registers open at once: if an account was left half-migrated, there was a real risk of charging the same customer twice — once from the legacy system, once from Killbill. The only viable option was a cold cutover: shut the legacy system down in one go and start billing on the new one the same day, without the account-by-account transition the documentation recommends.

That first clash between "what the manual says" and "what this particular kitchen demands" repeated itself several times over the course of the project. It's worth walking through, because the pattern matters more than any single case: the official documentation gives you the proven technique; the real business decides how much of that technique you actually get to use as-is.

## Same Seasoning, Even With a New Chef

Killbill ships with a configurable payment retry schedule for overdue subscriptions, with states like WARNING, BLOCKED, and CANCELLATION. It's a ready-to-use recipe. But this client wasn't coming in with a blank palate: they were already billing subscriptions on their legacy system, and they had their own retry schedule, tuned against their own customer base — and that's the one that got configured in Killbill, not the platform's default. The platform provides the structure; the business brings the seasoning it already knew worked.

## The Cook Doesn't Necessarily Run the Register

By design, Killbill doesn't touch payment methods. It doesn't store cards or credentials: that's always delegated to a plugin that talks to the payment gateway, specifically so it doesn't have to carry the weight of PCI compliance. It's a healthy separation of responsibilities, like a chef who cooks the dish but doesn't run the register.

The problem was that, in this project, the shortest path — Killbill talking directly to Braintree — wasn't an option. The business model required every order to be recorded in BigCommerce, no exceptions. So the charge couldn't fire through Braintree's back door: it had to go through BigCommerce's front counter, generating a temporary token of its own, with an expiration designed like a single-use nonce, to complete the charge without skipping the order record.

That constraint also showed up when testing the first automated charges. It was much simpler and faster to validate the flow with store credit and gift cards than with saved payment methods: in BigCommerce, to charge an order later through its payments API, that order has to be created in "Incomplete" status, and store credit — unlike a saved card — is only available to registered accounts, not to guest checkouts. They're pantry staples, ready to use without going through the full tokenization cycle a saved card requires.

## When the Kitchen Doesn't Know What Went Into Each Dish

The most uncomfortable part of the whole project was partial payments. It's not just that Killbill doesn't support a single payment covering multiple invoices at once — that alone already complicates things. The root of the problem was something else, and this one really was a project decision, not a platform limitation: Killbill does manage products and plans as part of its catalog, but in this project the line items on each BigCommerce order were never modeled as products or plans inside Killbill. So when an order had several line items and a partial payment came in, Killbill had no visibility into those items — not because it couldn't have had it, but because they never existed as such within its catalog in the first place.

It's like tracking a table's bill by diner instead of by dish: if the kitchen never wrote down what went into each dish at that table, and a payment comes in that only covers part of the check, there's no way to decide what's been settled — even though that same kitchen knows perfectly well, in general, how to itemize a bill dish by dish. That ambiguity, not a Killbill limitation, was the real root of the complexity: the logic had to be resolved at the plugin and custom proxy level, because in this project Killbill never had the data to resolve it on its own.

![Diagram from Killbill's official documentation showing the payment system architecture, including the payment plugin and Kaui](https://blog-media.ladetec.com/nitza-develop/migrando-suscripciones-killbill/migrando-suscripciones-killbill-2.webp)

## Separate Stations, Not One Shared Flame

To connect Killbill with BigCommerce without touching Braintree directly, the project ended up with a custom-built plugin: Killbill talks to a proxy of its own, and that proxy is what creates the order and fires the charge in BigCommerce. Building a piece like that in a system that was already billing in production sounds risky — and it would be, if Killbill worked like one shared open flame.

It doesn't: Killbill plugins run isolated inside OSGi containers, each with its own lifecycle. If one station in the kitchen goes down, it doesn't shut off the rest of the restaurant. That's what made it possible to iterate on the custom plugin without putting the subscription engine that was already running at risk.

## The Tax Seasoning Changes From One Service to the Next

Even the tax requirement, solved with Avalara, followed the same underlying pattern. Tax calculation for a SaaS subscription depends on where the service is consumed, not on where it's billed, and that calculation can change from one billing cycle to the next if the product, the price, or the customer's location changes. That's why integrating that calculation directly into the billing flow — on every billing run, not just at signup — reduces the risk of the tax recipe going stale mid-service.

## The Recipe Isn't the Dish

The pattern behind every one of these points is the same. Documentation for a mature platform like Killbill gives you a technique already validated by many kitchens before yours: useful, proven, and a reasonable starting point. But no documentation knows the exact constraints of your business — your payment provider, your e-commerce platform, your customer history, your tolerance for the risk of double-charging. Adapting the recipe to that specific kitchen isn't a shortcut or an improvisation: it's the real work.

If you've ever had to take a tool's official guide and adjust it against the concrete reality of your project, you probably recognize the pattern. Tell us on our social channels how you solved your own version of this problem — we'd love to compare recipes.
