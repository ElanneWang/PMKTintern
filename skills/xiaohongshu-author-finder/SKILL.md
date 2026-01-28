---
name: xiaohongshu-author-finder
description: "Automates discovering and following content creators on Xiaohongshu (小红书) based on topic relevance and engagement metrics. When you need to: (1) Find authors who posted about a specific topic, (2) Filter by minimum likes (default 50) and maximum followers (default 1000), (3) Automatically follow qualifying authors, and (4) Record results including note links, author profiles, and metrics. Use for market research, influencer outreach, or content monitoring on Xiaohongshu. NOT for: posting content, sending messages, or commenting."
---

# Xiaohongshu Author Finder Skill

## Overview

This skill automates the workflow of discovering content creators on Xiaohongshu (Little Red Book) based on specific topics and engagement criteria. It scrolls through the explore feed, identifies relevant notes, validates author credentials, and optionally follows qualifying creators.

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | Yes | - | Search topic/keyword to find relevant content |
| `minLikes` | number | No | 50 | Minimum likes required on a note |
| `maxFollowers` | number | No | 1000 | Maximum followers allowed on author profile |
| `maxNotes` | number | No | 50 | Maximum number of notes to scan before stopping |

## Workflow

### Phase 1: Initialize
1. Initialize `checkedAuthors` Set to track already-examined authors (session-level, resets on each run)
2. Initialize `results` array to store matching authors
3. Navigate to Xiaohongshu explore page: `https://www.xiaohongshu.com/explore`

### Phase 2: Scroll and Search
1. Scroll down the page incrementally (600-800px per scroll)
2. Wait for content to load (1.2-1.5 seconds between scrolls)
3. Repeat for 5-6 scroll cycles
4. Scan page text for topic matches (case-insensitive)
5. If matches found, proceed to Phase 3
6. If no matches, continue scrolling (up to `maxNotes` limit)

### Phase 3: Validate Note
1. Click on the matching note to view details
2. Extract note metrics (likes count)
3. If likes < `minLikes`: return to explore page, continue searching
4. If likes >= `minLikes`: proceed to Phase 4

### Phase 4: Validate Author
1. Click on author profile link
2. Extract follower count
3. If author already in `checkedAuthors`: skip, return to explore
4. If followers > `maxFollowers`: skip, add to `checkedAuthors`, return to explore
5. If followers <= `maxFollowers`: proceed to Phase 5

### Phase 5: Follow and Record
1. Click "关注" (Follow) button
2. Record result:
   - Note title
   - Note URL
   - Author name
   - Author URL
   - Likes count
   - Followers count
   - Timestamp
3. Add author ID to `checkedAuthors`
4. Return to explore page, continue searching

### Phase 6: Completion
1. Stop when `maxNotes` limit reached
2. Return summary:
   - Total notes scanned
   - Authors followed
   - Results array with all matched author details

## Error Handling

### Page Structure Changes
**Trigger**: When element click fails with "element not found" or similar structural errors.

**Recovery**:
```javascript
async function safeClick(uid, fallbackSelectors) {
  try {
    await click(uid);
  } catch (error) {
    if (isStructuralError(error)) {
      log("page_structure_changed", { uid, timestamp });
      for (const selector of fallbackSelectors.slice(0, 2)) {
        try {
          return await clickBySelector(selector);
        } catch {}
      }
      log("element_unavailable", { uid });
      return null; // Continue workflow, skip this element
    }
    throw error; // Re-throw non-structural errors
  }
}
```

**Fallback selectors**: Up to 2 alternative selectors per element
**Behavior on failure**: Log error, continue workflow (do not interrupt)

### Navigation Errors
- If page fails to load: retry navigation up to 2 times
- If scroll fails: continue with next step (content may already be loaded)

## Output Format

```json
{
  "summary": {
    "notesScanned": 30,
    "authorsFollowed": 1,
    "criteria": {
      "topic": "claude",
      "minLikes": 50,
      "maxFollowers": 1000
    }
  },
  "results": [
    {
      "noteTitle": "高强度使用claude code/code agent的三个月",
      "noteUrl": "https://www.xiaohongshu.com/explore/6968a326000000001a0241dc",
      "authorName": "Eric Liu",
      "authorUrl": "https://www.xiaohongshu.com/user/profile/6051af230000000001001a41",
      "likes": 389,
      "followers": 428,
      "followedAt": "2026-01-28T..."
    }
  ]
}
```

## Limitations

- Works only with Xiaohongshu (小红书) explore page
- Topic matching is text-based (case-insensitive), not semantic
- Results are limited to discoverable content in explore feed
- Session-level deduplication only (no persistent history)
- Follow button availability depends on login state and account limits
- May not find all relevant content due to feed algorithm

## Tips for Better Results

1. **Use specific topics**: "AI产品经理" finds more targeted content than "AI"
2. **Adjust maxNotes**: Increase for broader searches, decrease for faster results
3. **Check results**: Review output for accuracy, as feed content changes frequently
4. **Session management**: Run multiple times with different criteria for comprehensive coverage

## Examples

**Basic usage:**
```
Find authors about Claude on Xiaohongshu
```

**With custom criteria:**
```
Find and follow Xiaohongshu authors posting about cursor programming,
with at least 100 likes and under 500 followers, scanning max 30 notes
```

**JSON parameters:**
```json
{
  "topic": "AI编程",
  "minLikes": 100,
  "maxFollowers": 500,
  "maxNotes": 30
}
```
