# Claude Code Final Session Setup

## Complete Setup for Future Sessions

Copy this entire document and paste to Claude Code. It will execute all steps in order.

> **Shell Environment:** All bash commands assume Git Bash or WSL on Windows. For PowerShell, use `Get-Content` instead of `cat`, `Get-ChildItem` instead of `ls`.

---

## EXECUTE ALL STEPS BELOW IN ORDER

---

## STEP 1: Credential Audit - Find Conflicts

Read and compare credentials across these files:

```bash
# Check what credential files exist
ls -la C:\xampp\htdocs\PRIVATE\
cat C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md

# Check for other credential files
cat C:\xampp\htdocs\commerce-hub\CREDENTIALS-PRIVATE.md 2>/dev/null || echo "File not found"
cat C:\xampp\htdocs\rapidwoo-storefront\.env.local 2>/dev/null || echo "File not found"
cat C:\xampp\htdocs\rapidwoo-storefront\.env.production 2>/dev/null || echo "File not found"
cat C:\xampp\htdocs\commerce-hub\.env 2>/dev/null || echo "File not found"
```

Create a comparison table of credentials found in each file:

- WooCommerce consumer key/secret
- Supabase keys
- GitHub token
- Cloudinary cloud name
- Stripe keys

Report any conflicts.

---

## STEP 2: Verify WooCommerce Credentials

Test which WooCommerce credentials actually work:

```bash
# Test credential set 1: From CREDENTIALS-MASTER.md WooCommerce section
# Source: C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md
curl -s -o /dev/null -w "%{http_code}" "https://rapidwoo.com/e-commerce/wp-json/wc/v3/products?per_page=1" \
  -u "ck_a059f60b6acda82e7619985fe090cacbc52ee150:cs_5b82645d1de5de9b9bdfe5e46f25fb4eac647aaa"

# Test credential set 2: From MCP config (woocommerce server)
# Source: claude_desktop_config.json or .claude.json
curl -s -o /dev/null -w "%{http_code}" "https://rapidwoo.com/e-commerce/wp-json/wc/v3/products?per_page=1" \
  -u "ck_7bc0878e035b5a7fb6cf6358960db19f15c40133:cs_36d0c5e843b6a28639678b1e3ca542db633c3aae"

# Test credential set 3: From older project handoff docs
# Source: commerce-hub docs or legacy credential files
curl -s -o /dev/null -w "%{http_code}" "https://rapidwoo.com/e-commerce/wp-json/wc/v3/products?per_page=1" \
  -u "ck_e230e6dffb1f1a6d84b699d1b997b9666b015545:cs_4bd4aa392d6bfda27d71cf610629f582600574c3"
```

Report which credentials return 200 (valid) vs 401 (invalid).

---

## STEP 3: Verify GitHub Remotes

Check all repos point to nathanmcmullendev (NOT artmusuem):

```bash
cd C:\xampp\htdocs\commerce-hub && git remote -v
cd C:\xampp\htdocs\rapidwoo-storefront && git remote -v
cd C:\xampp\htdocs\ecommerce-react && git remote -v 2>/dev/null || echo "Repo not found"
```

If any point to artmusuem, fix them:

```bash
cd C:\xampp\htdocs\commerce-hub && git remote set-url origin https://github.com/nathanmcmullendev/commerce-hub.git
cd C:\xampp\htdocs\rapidwoo-storefront && git remote set-url origin https://github.com/nathanmcmullendev/rapidwoo-storefront.git
cd C:\xampp\htdocs\ecommerce-react && git remote set-url origin https://github.com/nathanmcmullendev/ecommerce-react.git
```

**Branch names:**
| Repo | Default Branch |
|------|----------------|
| commerce-hub | `main` |
| rapidwoo-storefront | `master` |
| ecommerce-react | `master` |

---

## STEP 4: Update CREDENTIALS-MASTER.md

Update C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md with:

### 4a. Fix GitHub Section

Change from:

```
Account:               artmusuem
Alt Account:           nathanmcmullendev
```

To:

```
Account:               nathanmcmullendev (PRIMARY - all active repos)
Legacy Account:        artmusuem (DEPRECATED - DO NOT USE)
```

### 4b. Update Repository URLs

```markdown
### Repositories

| Repo                | URL                                                      |
| ------------------- | -------------------------------------------------------- |
| Commerce Hub        | https://github.com/nathanmcmullendev/commerce-hub        |
| Gallery Store       | https://github.com/nathanmcmullendev/ecommerce-react     |
| RapidWoo Storefront | https://github.com/nathanmcmullendev/rapidwoo-storefront |
```

### 4c. Add RapidWoo Storefront Section (after Cloudinary section)

Add this content to CREDENTIALS-MASTER.md after the Cloudinary section:

````markdown
---

## RapidWoo Storefront (Vercel)

```
Production URL:                https://rapidwoo-storefront.vercel.app
GitHub:                        https://github.com/nathanmcmullendev/rapidwoo-storefront
Tech Stack:                    Next.js, WooCommerce GraphQL, Cloudinary, Vercel
PageSpeed Score:               99 (mobile)
```

### Environment Variables (Vercel)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD:  dh4qwuvuo
NEXT_PUBLIC_GRAPHQL_URL:       https://rapidwoo.com/e-commerce/graphql
REVALIDATE_SECRET:             rapidwoo-isr-secret-2026-x7k9m2
```

### ISR Revalidation Endpoint
```bash
curl -X POST https://rapidwoo-storefront.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"rapidwoo-isr-secret-2026-x7k9m2","path":"/products"}'
```

---
````

### 4d. Update Deployments Table

```markdown
## Deployments

| Project             | Production URL                               | Auto-Deploy  | PageSpeed |
| ------------------- | -------------------------------------------- | ------------ | --------- |
| Commerce Hub        | https://commerce-hub-iota.vercel.app         | Yes (GitHub) | -         |
| Gallery Store       | https://ecommerce-react-beta-woad.vercel.app | Yes (GitHub) | 95        |
| RapidWoo Storefront | https://rapidwoo-storefront.vercel.app       | Yes (GitHub) | 99        |
```

### 4e. Update Last Updated Date

Change to: January 9, 2026

### 4f. Update MCP Config WooCommerce Credentials

Update to use the VERIFIED working credentials from Step 2.

---

## STEP 5: Create Master Handoff Document

Create file: C:\xampp\htdocs\CLAUDE-CODE-HANDOFF.md

````markdown
# Claude Code Session Handoff

## Last Updated: January 9, 2026

---

## Quick Start for New Sessions

**First message to Claude Code:**

```
Read these files before doing anything:
1. C:\xampp\htdocs\CLAUDE-CODE-HANDOFF.md
2. C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md
Then tell me what projects exist and their current status.
```

---

## Project Locations

| Project             | Local Path                          | Status                     |
| ------------------- | ----------------------------------- | -------------------------- |
| RapidWoo Storefront | C:\xampp\htdocs\rapidwoo-storefront | ✅ Complete (99 PageSpeed) |
| Commerce Hub        | C:\xampp\htdocs\commerce-hub        | Active                     |
| Gallery Store       | C:\xampp\htdocs\ecommerce-react     | ✅ Complete (95 PageSpeed) |
| Private Credentials | C:\xampp\htdocs\PRIVATE             | Reference Only             |
| MCP Servers         | C:\xampp\htdocs\claude              | Custom MCPs                |

---

## Active Projects

### RapidWoo Storefront (COMPLETE)

| Item       | Value                                                |
| ---------- | ---------------------------------------------------- |
| Location   | C:\xampp\htdocs\rapidwoo-storefront                  |
| GitHub     | github.com/nathanmcmullendev/rapidwoo-storefront     |
| Production | rapidwoo-storefront.vercel.app                       |
| Status     | ✅ Performance optimization COMPLETE (99 PageSpeed)  |
| Key Doc    | RAPIDWOO-PERFORMANCE-GUIDE.md                        |
| Tech Stack | Next.js, WooCommerce GraphQL, Vercel, Cloudinary CDN |

### Commerce Hub (ACTIVE)

| Item       | Value                                                                   |
| ---------- | ----------------------------------------------------------------------- |
| Location   | C:\xampp\htdocs\commerce-hub                                            |
| GitHub     | github.com/nathanmcmullendev/commerce-hub                               |
| Production | commerce-hub-iota.vercel.app                                            |
| Status     | Multi-channel sync working, WooCommerce + Shopify                       |
| Key Docs   | docs/COMMERCE-HUB-HANDOFF-v2.md, docs/WOOCOMMERCE-SHOPIFY-SYNC-GUIDE.md |
| Tech Stack | React 18, TypeScript, Vite, Tailwind, Supabase, Vercel serverless       |

### Gallery Store (REFERENCE)

| Item       | Value                                                       |
| ---------- | ----------------------------------------------------------- |
| Location   | C:\xampp\htdocs\ecommerce-react                             |
| GitHub     | github.com/nathanmcmullendev/ecommerce-react                |
| Production | ecommerce-react-beta-woad.vercel.app                        |
| Status     | ✅ Complete - 95 PageSpeed reference implementation         |
| Purpose    | Botanical art storefront, Cloudinary optimization reference |

---

## Credentials

**Master credentials file:** C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md

Contains: GitHub, Supabase, WooCommerce, Shopify, Etsy, Stripe, Cloudinary, InMotion SSH, Twitter/X

**NEVER commit credentials to public repos.**

---

## Architecture Overview

### RapidWoo Storefront

```
Next.js (SSG + ISR) → WooCommerce GraphQL → Cloudinary CDN → Vercel
                              ↓
                    revalidate every 60s
                    on-demand via /api/revalidate
```

### Commerce Hub

```
React Admin Panel → Supabase (master products) → Platform APIs
                              ↓
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
         WooCommerce      Shopify          Etsy
         (REST API)    (GraphQL/OAuth)   (pending)
```

---

## Working Style Rules (CRITICAL)

1. **ONE file change at a time** - Don't batch changes
2. **Verify deployment before next change** - Wait 45-60s for Vercel
3. **STOP on errors** - Diagnose before rapid-fire fixing
4. **Meaningful commit messages** - Not "fix" "fix2" "fix3"
5. **Read existing docs BEFORE making changes**
6. **Don't suggest alternative tech stacks** - Decisions are made
7. **Senior developer approach** - No junior explanations needed

---

## Key Lessons Learned

### SSG/TypeScript

- GraphQL returns `null`, TypeScript may expect `undefined`
- Make fields optional: `image?: Image | null`
- SSG is stricter than CSR - types must match at build time

### Image Optimization

- `sizes` attribute determines which `srcSet` image browser downloads
- `src` is ignored when `srcSet` is present
- 2-column grid = 50vw, not 100vw
- Cloudinary fetch mode needs no API key, just cloud name

### Debugging

- PageSpeed filmstrip more reliable than score alone
- "100 score with no images" = broken page, not fast page
- LCP breakdown shows where time is spent (render delay vs download)
- Revert immediately if optimization causes regression

### MCPs

- MCPs are wrappers around authenticated API calls
- Can add custom tools like executeGraphQL for unlimited API access
- Custom MCPs at: C:\xampp\htdocs\claude\

---

## GitHub Account

**Active:** nathanmcmullendev  
**Deprecated:** artmusuem (DO NOT USE)

All repos transferred to nathanmcmullendev.

---

## First Commands for New Session

```bash
# Check recent work
cd C:\xampp\htdocs\rapidwoo-storefront && git log --oneline -5
cd C:\xampp\htdocs\commerce-hub && git log --oneline -5

# Verify remotes point to nathanmcmullendev
git remote -v

# Check branch
git branch
```

---

## Project-Specific Startup

### For RapidWoo work:

```
Read: C:\xampp\htdocs\rapidwoo-storefront\RAPIDWOO-PERFORMANCE-GUIDE.md
Status: Performance optimization complete (99 PageSpeed)
```

### For Commerce Hub work:

```
Read: C:\xampp\htdocs\commerce-hub\docs\COMMERCE-HUB-HANDOFF-v2.md
Status: Multi-channel sync working, Etsy pending API approval
```

---

## Recent Accomplishments (January 2026)

- RapidWoo: 75 → 99 PageSpeed (+24 points)
- LCP: 4.0s → 1.8s (55% faster)
- TBT: 280ms → 20ms (93% reduction)
- Complete SSG + ISR implementation
- Cloudinary image optimization
- Comprehensive documentation

---

## Reference Documents

| Doc                  | Location                                            | Purpose                  |
| -------------------- | --------------------------------------------------- | ------------------------ |
| This Handoff         | C:\xampp\htdocs\CLAUDE-CODE-HANDOFF.md              | Session startup          |
| Credentials          | C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md       | All API keys             |
| RapidWoo Guide       | rapidwoo-storefront\RAPIDWOO-PERFORMANCE-GUIDE.md   | Performance optimization |
| Commerce Hub Handoff | commerce-hub\docs\COMMERCE-HUB-HANDOFF-v2.md        | Multi-channel sync       |
| Shopify Sync Guide   | commerce-hub\docs\WOOCOMMERCE-SHOPIFY-SYNC-GUIDE.md | WooCommerce↔Shopify      |
````

---

## STEP 6: Update .claude Configuration

Check if .claude file exists and update it to auto-reference docs:

```bash
# User-level config (uses $USERPROFILE environment variable)
cat "$USERPROFILE/.claude" 2>/dev/null || echo "User .claude not found"

# Project-level config
cat C:\xampp\htdocs\.claude.json 2>/dev/null || echo "Project .claude.json not found"
```

If project-level .claude.json exists, add a startup instruction:

```json
{
  "startup": {
    "readFirst": [
      "C:\\xampp\\htdocs\\CLAUDE-CODE-HANDOFF.md",
      "C:\\xampp\\htdocs\\PRIVATE\\CREDENTIALS-MASTER.md"
    ]
  },
  "mcpServers": {
    // ... existing MCP config
  }
}
```

---

## STEP 7: Clean Up Duplicate Credential Files

After verification, if commerce-hub\CREDENTIALS-PRIVATE.md duplicates PRIVATE\CREDENTIALS-MASTER.md:

Option A: Delete the duplicate

```bash
rm C:\xampp\htdocs\commerce-hub\CREDENTIALS-PRIVATE.md
```

Option B: Replace with reference pointer
Create commerce-hub\CREDENTIALS-PRIVATE.md with just:

```markdown
# Credentials Reference

All credentials are in: C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md
DO NOT duplicate credentials in multiple files.
```

---

## STEP 8: Update Commerce Hub Handoff Docs

Update C:\xampp\htdocs\commerce-hub\docs\COMMERCE-HUB-HANDOFF-v2.md:

- Change all artmusuem GitHub references to nathanmcmullendev
- Update credentials location to point to C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md
- Add reference to CLAUDE-CODE-HANDOFF.md as master reference

---

## STEP 9: Verify Git Status

Ensure no uncommitted changes in repos:

```bash
cd C:\xampp\htdocs\commerce-hub && git status
cd C:\xampp\htdocs\rapidwoo-storefront && git status
```

If there are changes from doc updates, commit them:

```bash
cd C:\xampp\htdocs\commerce-hub && git add -A && git commit -m "docs: update handoffs with correct GitHub account and credential locations"
cd C:\xampp\htdocs\commerce-hub && git push
```

---

## STEP 10: Final Summary Report

After completing all steps, provide:

1. **Credential Audit Results**
   - Conflicts found and resolved
   - Which WooCommerce credentials are valid
2. **Files Created/Updated**
   - C:\xampp\htdocs\CLAUDE-CODE-HANDOFF.md (created)
   - C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md (updated)
   - Any repo docs updated
3. **Git Status**
   - All repos clean
   - Remotes pointing to nathanmcmullendev
4. **Verification Checklist**
   - [ ] All credential files consistent
   - [ ] GitHub remotes correct
   - [ ] Handoff doc created
   - [ ] Credentials master updated
   - [ ] Duplicate files cleaned up
   - [ ] Repo docs updated
   - [ ] All changes committed

5. **Output Updated CREDENTIALS-MASTER.md**
   - Provide complete file content for download/backup

---

## END OF SETUP INSTRUCTIONS

After Claude Code completes all steps, new sessions can start cleanly with:

```
Read these files before doing anything:
1. C:\xampp\htdocs\CLAUDE-CODE-HANDOFF.md
2. C:\xampp\htdocs\PRIVATE\CREDENTIALS-MASTER.md
Then tell me what projects exist and their status.
```
