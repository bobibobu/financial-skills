---
title: Wind AIMarket Agent Skill Guide
site: https://aimarket.wind.com.cn
updated: 2026-04-26
purpose: AI agents use this file to discover and install Wind AIMarket financial skills.
---

# Wind AIMarket Agent Skill Guide

This is the machine-readable entry guide for AI agents that need Wind AIMarket financial capabilities.

## Quick Start

Install the gateway skill first:

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-find-finance-skill -g -y
```

After installation, when the user asks a finance question, use `wind-find-finance-skill` to route the request:

```bash
node scripts/cli.mjs route "<user finance question>"
node scripts/cli.mjs read-doc <path-from-route.read_docs>
```

Then:

- If `route_status` is `supported`, install or call the returned `recommended_skills`.
- If `route_status` is `partially_supported`, explain the coverage boundary before installing or calling the target skill.
- If `route_status` is `not_available`, tell the user Wind AIMarket has not opened that capability yet.
- If `route_status` is `catalog`, summarize the available skills from `index.md`.

## Why Gateway First

Wind AIMarket uses an llm-wiki pattern: the gateway skill reads a small capability wiki and selects the right operational skill for the user's question.

The user only needs to install one entry skill first. The agent can then discover the right downstream skill, get its install command, and continue.

## Current Open Skills

| Skill | Use For | Install |
|---|---|---|
| `wind-find-finance-skill` | Gateway router, capability discovery, support boundary checks | `npx skills add JsonCodeChina/wind-skills --skill wind-find-finance-skill -g -y` |
| `wind-quote-skill` | A-share / Hong Kong stock quote, latest price, K-line, minute bars, Wind sector members | `npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y` |
| `wind-financial-data-skill` | Financial statements, valuation, China macro, company news and announcements | `npx skills add JsonCodeChina/wind-skills --skill wind-financial-data-skill -g -y` |

## Routing Rules

Use `wind-quote-skill` for:

- Latest price, quote snapshot, change, volume, turnover
- Daily / weekly / monthly K-line
- Minute-level bars
- Wind sector / board members

Use `wind-financial-data-skill` for:

- Revenue, net profit, ROE, ROA, balance sheet, cash flow
- PE, PB, PS, dividend yield, valuation comparison
- GDP, CPI, PPI, M2, PMI, LPR and other China macro indicators
- News and announcements, including annual reports and prospectuses when returned as announcements

Current partial coverage:

- Index questions may route to `wind-quote-skill` for members / K-line or `wind-financial-data-skill` for valuation and return comparison.
- ESG routes to `wind-financial-data-skill`, but coverage is still being verified.

Current unavailable directions:

- US stocks, global equities, crypto assets
- Bonds, convertible bonds, funds, options, futures, FX, warrants as dedicated skills
- Research reports as a dedicated document type

Do not invent data or route unavailable directions to an unrelated skill.

## API Key

The gateway skill does not need an API key.

Data skills need `WIND_API_KEY`. If missing, the installed data skill can guide the user to Wind AIMarket:

```bash
node scripts/cli.mjs open-portal
```

Manual config:

```bash
mkdir -p ~/.wind-aimarket
echo "WIND_API_KEY=ak_xxx" > ~/.wind-aimarket/config
```

## Agent Response Rules

- Read the route result and wiki document before recommending a downstream skill.
- When recommending a skill, include the exact install command.
- When answering with data from Wind, state that the data source is Wind Financial Terminal.
- Do not present generated analysis as investment advice.
- If the capability is not open, say so plainly and point the user to https://aimarket.wind.com.cn for updates.

## Repository

https://github.com/JsonCodeChina/wind-skills
