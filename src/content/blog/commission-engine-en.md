---
title: "The Recipe No One Wrote Down: Migrating 20 Years of Commissions With No Plan B"
description: "How we migrated a 20-year-old legacy commission system with a total no-plan-B cutover: two systems running the same month, the recursive generational-director commission calculation, and the decision to understand the business before touching the code."
pubDate: 2026-09-02
lang: "en"
category: "Nota de Cata"
categorySlug: "nota-de-cata"
readingTime: 8
---

![Professional kitchen merging into a server room, representing the no-plan-B cutover of a legacy commission system](https://blog-media.ladetec.com/nitza-develop/commission-engine/commission-engine-1.webp)

# The Recipe No One Wrote Down: Migrating 20 Years of Commissions With No Plan B

At 11:59 PM on the 20th of the month, the legacy system shut down. There was no soft transition period, no "let's run the old system for another couple of weeks just in case": the new commission engine went live that same night, and the old one ceased to exist. It's the equivalent of closing a kitchen that had served the same menu for twenty years and opening, the very next day, a new restaurant with the same menu but different cooks, different stoves, and — as we would soon discover — a recipe that no one had ever actually written down.

The immediate result was that the first two pay periods of the month were calculated by different systems: part of it by the old engine, which no longer existed to consult if something didn't add up, and part by the new one, which didn't yet know all the business rules. When a payment system runs like that, without a real period of cross-verification, distrust isn't a theoretical risk — it's almost arithmetic. When running two systems in parallel isn't paired with strict, figure-by-figure reconciliation, the sense of safety that comes from "having two systems running at once" is false, and payment discrepancies produce exactly the problem we lived through: in the moment of conflict, no one knows which of the two numbers to trust. That was the root of the four months that followed: commission cycles riddled with errors, working side by side with the client's finance department to reconcile amounts, and the same question coming up again and again — was the problem in the source data, in the new logic, or in the old logic that no one could run anymore to check?

## A Twenty-Year-Old Recipe, With No Recipe Card

The system we were replacing had been in production for two decades. The source code was always available — that much needs to be said clearly, it wasn't an inaccessible black box — but available isn't the same as readable. It was a maze of SQL accumulated over twenty years, with parameters that, depending on the year a given commission plan had been configured, completely changed the path the calculation took. That pattern isn't exotic, and it's not unique to this client: the buildup of conditional logic driven by parameters is a well-documented form of technical debt, and there's empirical evidence that the repeated presence of this kind of "spaghetti code" measurably increases the time and cognitive effort required from whoever has to modify it. Nobody needed to warn us — opening the first stored procedure and following the thread of nested IFs was enough to feel it.

The real challenge, though, wasn't that maze by itself. It was one specific dish on the menu: generational director commissions.

## The Impossible Dish: Recursive, MLM-Style Commissions

In the client's compensation scheme, a director didn't just earn on their own direct network — they earned on successive generations of directors beneath them, a recursive structure of the kind you see in multi-level marketing compensation plans. Modeling that isn't unusual on its own: SQL has a standard mechanism for exactly this, recursive CTEs, built to traverse organizational hierarchies of variable depth. The tool wasn't the problem. The problem was that the hierarchy changed over time — directors moving up or down levels, networks reorganizing — and correctly modeling a hierarchy that mutates historically is a recognized, hard problem even in mature data modeling, related to what data warehousing calls slowly changing dimensions, type 2. On top of that, there wasn't enough clean historical data to validate the calculation against, and the person who had originally designed that logic was no longer available to the team.

It's the worst possible combination in a kitchen: the most complex dish on the menu, without the chef who invented it, without any written notes, and with customers already seated at the table waiting for their order.

![Nested white ceramic plates arranged in a tree-like branching pattern connected by golden threads, representing the recursive structure of generational director commissions](https://blog-media.ladetec.com/nitza-develop/commission-engine/commission-engine-2.webp)

## Understanding the Business Before Touching the Stove

Faced with that scenario, the project lead made a decision that looked, on the surface, like it would slow everything down: don't touch the code yet. Before writing a single line of the new commission logic, the team sat down to understand the business and the math behind the compensation plan — what a "generation" actually meant, how an active director was defined, what happened when someone changed level mid-month — working with the same finance department they were already reconciling payments with.

That decision isn't just anecdotal. Eric Evans, the reference author on domain-driven design, describes a phenomenon he calls "legacy blindness": familiarity with an existing domain model ends up getting in the way of thinking about the problem differently, because the old code has already dictated — without you noticing — what the new solution is supposed to look like. Reading legacy SQL line by line, without first understanding what business problem each parameter was solving, is exactly the trap that concept describes: you end up replicating the old structure, spaghetti and all, instead of solving the actual problem.

The contrast with what can go wrong in a total cutover with no safety net isn't hypothetical. One of the best-documented cases in banking is TSB Bank's 2018 migration: a "big bang" system switch with no rollback plan, which ended in a £48.65 million regulatory fine, more than £32 million in customer compensation, and the CEO's resignation. It's not a direct parallel — TSB is a bank moving customer accounts, not a commission engine for a consultant network — but it illustrates the same structural risk: switching off the old system with no plan B and finding out afterward, in production, that what you were replacing wasn't fully understood.

## Why a Small Bug Felt So Big

There was another reason to move cautiously: in a multi-level commission scheme, a small error in the logic doesn't stay isolated in one account. Because of how these plans work — each level depends on the calculation of the one below it — a bug in how a single generation gets summed tends to propagate and hit the entire consultant base at once, not just one edge case. That explains why four months of buggy cycles caused so much friction with the client: these weren't isolated failures that were easy to pinpoint and fix, but mismatches that replicated structurally every time the calculation ran.

## The Point Where an Error Stops Being a Problem

Understanding the business first, and only then touching the code, didn't make the errors disappear overnight. They shrank cycle after cycle, as the team and finance were able to trace each discrepancy back to a specific cause in the plan's rules, instead of a vague suspicion that "something's wrong with the new system." By the end of the process, one residual error remained: about $100 in differences spread across payments that together totaled hundreds of thousands of dollars, distributed among thousands of consultants. In a kitchen, that's the difference between a perfect dish and a properly seasoned one: there's no such thing as a perfect commission at that scale — there's a commission accurate enough that no one at the table notices the difference. The client accepted it as such, and the relationship didn't just hold — today the company trusts us with other pieces of its technology stack.

## The Principle, Beyond Commissions

If you're about to migrate a legacy system — commissions or any other complex business logic accumulated over years — the natural temptation is to start with the code, because code is what you can read, debug, and version. But twenty-year-old code isn't the source of truth: it's just the trail, often contradictory, of business decisions made at different points in time that are almost never documented anywhere else. Understanding first what real problem each rule solves — even if it delays the first commit — is what separates a well-digested cutover from one that ends in a middle-of-the-night panic.

If this sounds familiar, here's how we solved it — tell us your version in the comments, or follow us for more cases like this one.
