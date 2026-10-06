---
title: "Cooking with What's in the Pantry: Iterating the Hardware of a GPS Tracker for Hotshot Trailers"
description: "How we iterated the hardware of a GPS tracker for a Houston client's hotshot trailers: from an Arduino Nano out of memory to a commercial LilyGo board, by way of a custom regulator board and PCB, and the client's outside question that revealed months of unquestioned design decisions."
pubDate: 2026-10-05
lang: "en"
category: "Nota de Cata"
categorySlug: "nota-de-cata"
readingTime: 10
---

# Cooking with What's in the Pantry: Iterating the Hardware of a GPS Tracker for Hotshot Trailers

Towit Houston came to us with a problem that was neither abstract nor hypothetical: their hotshot trailers kept going missing. This isn't a theoretical security risk — cargo theft in North America (the US and Canada) hit 3,625 incidents in 2024, up 27% from the year before, with an average loss of $202,364 per incident. Texas ranks among the three hardest-hit states on the continent. And when the stolen equipment is rented, as it was for Towit, the odds of recovering it through law enforcement drop to 10-15%, far below the ~60% baseline for stolen vehicles in general. Every trailer without visibility was, literally, money that could vanish from the operation without a trace.

The ask was concrete: a device that reported the trailer's location, running on battery because a hotshot trailer has no constant power supply, and rugged enough to survive weeks exposed to the elements with zero maintenance. None of that sounded exotic on paper. In practice, every constraint — power, space, environmental exposure — ended up forcing a different design decision, and some of those decisions took us longer than they should have to question.

![From several separate hand-wired boards to a single integrated PCB: the iteration journey of the GPS tracker for hotshot trailers.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-1.webp)

## First Iteration: Arduino Nano with Separate Boards

We started with what we knew. An Arduino Nano with external GPS and cellular modules wired into a generic protoboard/shield made sense: mature libraries for almost any peripheral, a short learning curve for the team, and a working prototype in days instead of weeks. It's the same logic any developer under deadline pressure would apply — reach for the library you already have installed instead of evaluating ten alternatives before writing the first line. Cooking with what's in the pantry, not running out to buy a new ingredient for every dish.

![First prototype: cellular module stacked on an Arduino Nano on a protoboard.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-2.webp)

![NEO-6M GPS module wired on the protoboard next to the cellular module, first iteration.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-3.webp)

The limit showed up fast, and it was physical, not architectural: the binary didn't fit. The ATmega328 on the Nano has 32KB of flash total, of which roughly 2KB goes to the bootloader, leaving about 30KB usable. GPS parsing logic, cellular connectivity handling, and power management together blew past that budget. This wasn't a bug patient optimization could fix; it was a hard memory ceiling no refactor was going to solve — comparable to trying to cram a monolith with too many dependencies into a container with a fixed image size limit.

## Second Iteration: ESP32 with External Modules (SIM7020G + GPS)

Moving to the ESP32 solved the memory problem immediately. The ESP32-WROOM-32 packs 520KB of SRAM and 4MB of flash — an order-of-magnitude jump over the Nano that took storage space off the table as an issue. We kept the separate-boards setup, pairing the ESP32 with a SIM7020G module for connectivity and a NEO-6M GPS module. This second version already covered the basics: report position, survive without external power, and hold up outdoors.

![ESP32 connected to the NEO-6M GPS module and external GPS antenna, second iteration.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-4.webp)

![ESP32 wired to a cellular shield during connectivity testing in the second iteration.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-5.webp)

![Second-iteration test bench with the power regulator module connected.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-6.webp)

It worked. But "it works" and "it's the right architecture" aren't the same claim, and the problem now shifted to battery life.

## Third Iteration: A Custom Board for Low-Power LDO Regulation

With the memory problem solved, the bottleneck shifted to power. With no constant current, the tracker runs entirely on battery, and that battery has to last weeks in sleep mode between position reports. That's where off-the-shelf commercial hardware fell short.

A generic LDO regulator like the AMS1117, found on most cheap ESP32 dev boards, draws between 5 and 10mA even at rest (quiescent current). A low-power LDO like the MCP1700 brings that down to ~1.6µA — several orders of magnitude less. We designed our own 3.3V regulator adapter board to power the ESP32, replacing the stock regulation it shipped with.

![Custom-designed low-power regulator board to power the ESP32, with the module soldered on top.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-7.webp)

![3D render of the custom regulator board design before fabrication.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-8.webp)

![Trace routing view of the low-power regulator board.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-9.webp)

![Close-up of the ESP32-WROOM-32 soldered onto the already-fabricated regulator board.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-10.webp)

![Test bench of the custom regulator board alongside the cellular module, third iteration.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-11.webp)

![Second test session of the custom regulator board with the cellular module connected.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-12.webp)

We applied the same scrutiny to the NEO-6M GPS module: it draws 45mA in normal operation, but drops to 11mA in Power Save Mode. With no engine keeping the battery charged, every milliamp saved translated directly into more days of autonomy in the field. It's the same kind of call a software architect makes when choosing between a process that's always running in memory and one that spins up only when there's real work to do: idle resource consumption matters just as much as consumption under load.

## Fourth Iteration: A Custom PCB (ESP32 + SIM7020G Chip, Soldered)

Separate boards linked by wires and connectors in a high-vibration environment like a cargo trailer was a recipe for intermittent failures. We decided to take a qualitative leap and move to a custom electronic design at the surface-mount component level.

We designed a custom PCB with the ESP32 module, the SIM7020G chip, the low-power regulator circuit, and the power/GPS stages all soldered directly onto it. The result was a rigid block, no loose wires, a significantly smaller footprint, and much higher tolerance for an industrial environment.

![Custom PCB with the ESP32 and cellular modem soldered directly, eliminating loose wires between components.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-13.webp)

![3D render of the custom PCB, showing the GPS/LTE connectors, MiniSIM socket, and charging stage.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-14.webp)

![2D design view of the front face of the custom PCB.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-15.webp)

![2D design view of the back face of the custom PCB.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-16.webp)

![Close-up of the ESP32-WROOM-32 module soldered directly onto the custom PCB.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-17.webp)

![Close-up of the cellular modem soldered directly onto the custom PCB.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-18.webp)

## The Mechanical Design: A Discreet False Bottom in FreeCAD

The physical install ran in parallel with the electronics' evolution. We designed a false bottom in FreeCAD inside the trailer's junction box to house the board and antenna discreetly, without interfering with the existing electrical mechanism or altering the equipment's appearance. This wasn't about hiding anything: it was a mechanical integration problem — figuring out where a new component lives without touching or degrading what was already working. The physical equivalent of adding a monitoring service to a system without touching its public interface.

![3D-printed interior compartment housing the board and antenna inside the trailer's junction box.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-21.webp)

![3D-printed parts of the false-bottom compartment, before assembly.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-22.webp)

![Detail of the mounting points of the false-bottom compartment.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-23.webp)

On the software side, the backend was deliberately simple: Django running on PythonAnywhere, just enough to receive position reports and plot them on a map. There was no need to build anything more than that for the problem at hand.

## The Turn: A Question from the Outside

After months of defending every hardware decision as the right one, and after going through the work of designing and hand-soldering our own PCBs, the client asked us something on a check-in call that we didn't see coming: "Why didn't you just use that board from the start?" — referring to the LilyGo with its integrated SIM7000G module, the commercial board we'd just migrated to.

![Commercial LilyGo board with integrated SIM7000G cellular module, fifth and final iteration.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-19.webp)

![Detail of the LilyGo board showing the integrated battery holder and pin labels.](https://blog-media.ladetec.com/nitza-develop/gps-tracker-trailers-hotshot/gps-tracker-trailers-hotshot-20.webp)

We'd landed on that board for a very concrete reason, not out of whim: with the custom PCB already in production, we felt the operational cost of hand-assembling and soldering every unit ourselves, or of ordering small batches of populated PCBs from a manufacturer. The LilyGo packed the microcontroller, the cellular modem, the GPS, and the battery-charging circuit onto a single commercial board — fewer parts, lower cost per unit, zero hours of manual soldering, fewer field failure points, and firmware that was simpler to maintain, a consolidation not unlike replacing a handful of hand-rolled microservices with a single managed service that covers the same responsibilities. For a team that was going to have to provide remote support to dozens of devices already installed on trailers scattered across Texas, that simplicity wasn't a cosmetic detail: it was less surface area to debug from a distance.

We didn't have a solid technical answer. We'd walked the entire linear iteration path (Arduino → separate boards → custom regulator board → custom PCB → LilyGo) because each step was the immediate fix for the previous phase's problem, not because we'd surveyed the full market of integrated boards from day one. Someone who hadn't tasted every previous dish found in seconds something we'd stopped questioning for months of development.

## The Principle: Iterate Fast, But Schedule the Outside Perspective

The lesson isn't that you need to exhaustively evaluate every option before writing a line of code or soldering a component — that only delays the learning only a real prototype can give you. Starting with an Arduino and protoboard modules let us validate the concept in days, and in hindsight that was still the right call.

The problem wasn't starting simple or building custom PCBs: it was never scheduling, ourselves, a checkpoint with eyes that didn't carry the same stack of accumulated decisions. That outside perspective doesn't have to show up by accident on a client check-in call — it can and should be scheduled on purpose, the same way a software team schedules a code review or an architecture check before scaling something that started life as a proof of concept.

## Results in Production

At peak, we had more than 20 devices of this design running on Towit Houston's trailers, with an overall uptime of around 75%, and cases of trailers recovered after more than a month without signal, because the prior location history was still intact in the backend.

The final architecture — LilyGo SIM7000G, a discreet false bottom in FreeCAD, and a lightweight backend — should have been the first serious candidate once the initial software was validated. Getting there the long way didn't invalidate the result, but it did make clear the difference between iterating progressively and stepping back in time to look at the whole pantry.

If something similar has happened to you — iterating so long on the same technical decision that you lost sight of it — tell us on social media how you solved it.
