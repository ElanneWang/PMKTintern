---
name: xiaohongshu-author-finder
description: "Automates discovering and following content creators on Xiaohongshu (小红书) based on topic relevance and engagement metrics. Use when user needs to: (1) Find authors who posted about a specific topic via the EXPLORE PAGE (not search), (2) Filter by minimum likes (default 50) and maximum followers (default 1000), (3) Automatically follow qualifying authors, and (4) Record results including note links, author profiles, and metrics. NOT for: posting content, sending messages, commenting, or using search."
---

# Xiaohongshu Author Finder Skill

## Overview

This skill automates discovering and following content creators on Xiaohongshu (Little Red Book) by **scrolling the explore page** (NOT using search). It uses `chrome-devtools` MCP tools to control the browser through the complete workflow.

## Quick Start

**Trigger when user says:**
- "Find authors about X on Xiaohongshu"
- "找到小红书上关于 X 的达人"
- "发现页找低粉高赞达人"

**NOT for:**
- Using search bar (xiaohongshu search is forbidden)
- Posting, commenting, or messaging

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | Yes | - | Topic/keyword to find relevant content in explore feed |
| `minLikes` | number | No | 50 | Minimum likes required on a note |
| `maxFollowers` | number | No | 1000 | Maximum followers allowed on author profile |
| `maxNotes` | number | No | 50 | Maximum number of notes to scan before stopping |

## Browse Limits

Control how long the skill scrolls in the explore page:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxScrolls` | 10 | Maximum number of scroll actions (prevents infinite scrolling) |
| `maxNotes` | 50 | Maximum number of notes to check (stops after checking N notes) |
| `scrollInterval` | 5000ms | Wait time between scrolls (avoids bot detection) |

**Note:** Skill stops when either maxNotes reached OR target number of authors found.

## Workflow (USE MCP TOOLS)

**Core Principle**: Use `chrome-devtools` MCP to control the browser like a human user while efficiently extracting data via scripts. 
- **Anti-Bot Strategy**: 
  - Scripts (`scan_feed.js`) implement human-like jitter and smooth scrolling.
  - Claude monitors `console` logs via MCP to detect warnings/blocks.
  - **Network Monitoring**: If page loading stalls, check Network panel for 403/429 errors.

### Phase 1: Navigate to Explore Page
1. Use `navigate_page` to open: `https://www.xiaohongshu.com/explore`
2. Wait for page to load with `wait_for` text "发现"
3. **Initialize tracking structures**:
   - `checkedAuthors = new Set()` - Track examined authors by profile URL
   - `results = []` - Store matching authors
   - `notesChecked = 0` - Counter for notes processed

### Phase 2: Batch Scan & Filter (Script-Based)
1. **Human-Mimic Scan**:
   - Use `read_file` to load script: `skills/xiaohongshu-author-finder/scripts/scan_feed.js`
   - Execute script using `evaluate_script` with args: `{ "maxScrolls": 5 }`
   - *Note*: The script handles random intervals and smooth scrolling internally.
2. **Analyze Script Output (JSON)**:
   - Filter the returned `notes` list based on `topic` keywords in `title` or `rawText`.
   - **Deduplicate**: Skip notes whose author is already in `checkedAuthors`.
   - Select valid candidates that haven't been checked yet.
3. If no candidates found: Continue to scroll or stop.

### Phase 3: Process Candidates (Loop)
For each valid candidate from Phase 2:
1. **Navigate to Note**:
   - Use `click` on the candidate's `elementSelector` (e.g., `a[href="..."]`).
   - Wait for page load.
   - *Anti-Bot Check*: If page redirects to login/captcha, stop and notify user.

### Phase 4: Validate Details (Script-Based)
1. Use `read_file` to load script: `skills/xiaohongshu-author-finder/scripts/extract_stats.js`
2. Execute script using `evaluate_script`.
3. **Check Logic**:
   - Use the returned JSON `stats.likes`.
   - Extract `authorUrl` from page (author profile link href).
   - If `authorUrl` is in `checkedAuthors`: skip, navigate to explore.
   - If `likes < minLikes`:
     - Add `authorUrl` to `checkedAuthors`.
     - Go back (`navigate_page` to explore or `history.back()`).
     - Continue to next candidate.

### Phase 5: Validate Author & Follow
1. If note qualifies, click author profile link (from UI).
2. Wait for profile load.
3. Execute `extract_stats.js` again.
4. **Check Logic**:
   - Use JSON `stats.followers`.
   - If `followers > maxFollowers`:
     - Add `authorUrl` to `checkedAuthors`.
     - `navigate_page` to explore, continue searching.
   - If `followers <= maxFollowers`:
     - Click "关注" (Follow) button.
     - Record success to `results` array.
5. **Return to Explore**:
   - `navigate_page` to `https://www.xiaohongshu.com/explore`.


### Phase 6: Record Result and Return to Explore
1. Extract data from script output (`extract_stats.js`):
   - Note title, Note URL
   - Author name, Author URL
   - Likes count, Followers count
2. Add to `results` array with ISO timestamp.
3. Add `authorUrl` to `checkedAuthors` (prevents re-checking in same session).
4. **Return to explore page**:
   - Use `navigate_page` to open `https://www.xiaohongshu.com/explore`

### Phase 7: Continue or Return Results
1. Increment notes checked counter.
2. If notes checked < maxNotes AND authors found < target: go to Phase 2.
3. Otherwise, return results.

### Phase 8: Return Results
```json
{
  "summary": {
    "notesScanned": 30,
    "authorsFollowed": 3,
    "scrollsPerformed": 8,
    "criteria": { "topic": "clawdbot", "minLikes": 50, "maxFollowers": 1000, "maxScrolls": 10 }
  },
  "results": [
    {
      "noteTitle": "没有太理解买mac mini来部署clawdbot的",
      "noteUrl": "https://www.xiaohongshu.com/explore/6978412f000000001a028f44",
      "authorName": "终觉浅",
      "authorUrl": "https://www.xiaohongshu.com/user/profile/67f1bd60000000000d00bcdc",
      "likes": 104,
      "followers": 139,
      "followedAt": "2026-01-28T10:30:00.000Z"
    }
  ]
}
```

## Fixed Script Patterns (REUSABLE)

### Pattern: Run Extraction Script
```javascript
// Load and run script to get JSON data
const script = await read_file("skills/xiaohongshu-author-finder/scripts/extract_stats.js");
const data = await evaluate_script({ script: script });
// Use data.stats.likes, data.stats.followers
```


### Pattern: Close Author and Return (FAIL CRITERIA)
```javascript
// After validating author fails follower criteria
navigate_page        // Navigate to explore page
// Example:
navigate_page({ url: "https://www.xiaohongshu.com/explore" })
```

### Pattern: Skip Note and Continue (FAIL CRITERIA)
```javascript
// After validating note fails likes criteria
navigate_page        // Navigate to explore page
// Example:
navigate_page({ url: "https://www.xiaohongshu.com/explore" })
```

### Pattern: Return After Success
```javascript
// After following author successfully
navigate_page        // Navigate to explore page for next search
// Example:
navigate_page({ url: "https://www.xiaohongshu.com/explore" })
```

## Error Handling

| Error Type | Handling |
|------------|----------|
| Element not found | Log error, continue workflow |
| Author URL extraction failed | Use snapshot to find author link manually |
| Follow button not found | Skip follow, still record result |
| Navigation failure | Retry up to 2 times, then skip |
| Page structure changed | Take new snapshot, adapt selectors |
| Already followed (in checkedAuthors) | Skip to next candidate |
| checkedAuthors memory limit | Session-only, clears on skill restart |
| maxScrolls reached | Stop and return current results |
| maxNotes reached | Stop and return current results |

## Tips

- **Specific topics work better**: "AI产品经理" finds more targeted content than "AI"
- **Check login state**: Follow button requires user to be logged in
- **Track checked authors**: Use `checkedAuthors` Set to avoid duplicate work (session-level)
- **Deduplicate early**: Check `checkedAuthors` before clicking notes to save time
- **Never use search**: Always scroll the explore page
- **Check relevance early**: Validate note topic before clicking to save time

## Limitations

- Works only with Xiaohongshu explore page (no search)
- Topic matching is text-based (case-insensitive), not semantic
- Results limited to discoverable content in explore feed
- Deduplication is session-only (resets on each skill run)
- Bot detection: respect scrollInterval to avoid being blocked
