/**
 * Extracts stats from Note or Profile page.
 * Returns structured data to avoid image analysis.
 * Enhanced with multiple regex patterns for robustness.
 *
 * Usage in Claude:
 * await evaluate_script({ script: <content_of_this_file> })
 */
(function() {
    const text = document.body.innerText;
    const pageHtml = document.documentElement.innerHTML;

    // Helper: parse Chinese number formats (e.g., "1.2万", "3.5w", "1200")
    function parseXHSNumber(str) {
        if (!str) return null;
        let numStr = str.trim();
        let multiplier = 1;

        // Handle Chinese 万 and English w/W variations
        if (numStr.includes('万') || numStr.match(/[wW]\.?\d*$/)) {
            multiplier = 10000;
            numStr = numStr.replace(/[万wW]/g, '');
        }

        // Handle decimal points and extract numeric portion
        const match = numStr.match(/^[\d.]+/);
        if (!match) return null;

        const value = parseFloat(match[0]);
        return isNaN(value) ? null : value * multiplier;
    }

    // Helper: Find first match with multiple pattern attempts
    function findMatch(patterns, text) {
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match;
        }
        return null;
    }

    // Extract likes - multiple patterns for different UI variations
    const likesPatterns = [
        /(\d+[\d.,]*[万wW]?)\s*[,，]?\s*赞/,
        /赞[：:\s]*(\d+[\d.,]*[万wW]?)/,
        /(\d+[\d.,]*[万wW]?)\s*个?\s*赞/,
        /❤️\s*(\d+[\d.,]*[万wW]?)/,
        /(\d+)\s*赞$/m
    ];

    // Extract followers - multiple patterns
    const followersPatterns = [
        /(\d+[\d.,]*[万wW]?)\s*[,，]?\s*粉丝/,
        /粉丝[：:\s]*(\d+[\d.,]*[万wW]?)/,
        /(\d+[\d.,]*[万wW]?)\s*个?\s*粉丝/,
        /fans[:\s]*(\d+[\d.,]*[万wW]?)/i
    ];

    // Extract follows (following count)
    const followsPatterns = [
        /(\d+[\d.,]*[万wW]?)\s*[,，]?\s*关注/,
        /关注[：:\s]*(\d+[\d.,]*[万wW]?)/,
        /(\d+[\d.,]*[万wW]?)\s*个?\s*关注/
    ];

    // Extract collected/bookmarked count
    const collectedPatterns = [
        /(\d+[\d.,]*[万wW]?)\s*[,，]?\s*收藏/,
        /收藏[：:\s]*(\d+[\d.,]*[万wW]?)/,
        /(\d+[\d.,]*[万wW]?)\s*个?\s*收藏/
    ];

    // Try to extract author URL from page
    let authorUrl = null;
    const authorLinkPatterns = [
        /href=["']([^"']*user\/profile[^"']*)["']/,
        /<a[^>]+href=["']([^"']+)["'][^>]*>/g
    ];

    for (const pattern of authorLinkPatterns.slice(0, 1)) {
        const match = pageHtml.match(pattern);
        if (match && match[1] && match[1].includes('user/profile')) {
            authorUrl = match[1];
            break;
        }
    }

    // Try to extract author name
    let authorName = null;
    const authorNamePatterns = [
        /["']authorName["'][,:\s]*["']([^"']+)["']/,
        /<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/span>/
    ];

    for (const pattern of authorNamePatterns) {
        const match = (pageHtml + text).match(pattern);
        if (match && match[1]) {
            authorName = match[1].trim();
            break;
        }
    }

    // Extract note title
    let noteTitle = null;
    const titlePatterns = [
        /<h1[^>]*>([^<]+)<\/h1>/,
        /<title>([^<]+)<\/title>/,
        /["']noteTitle["'][,:\s]*["']([^"']+)["']/
    ];

    for (const pattern of titlePatterns) {
        const match = pageHtml.match(pattern);
        if (match && match[1]) {
            noteTitle = match[1].trim();
            break;
        }
    }

    const likesMatch = findMatch(likesPatterns, text);
    const followersMatch = findMatch(followersPatterns, text);
    const followsMatch = findMatch(followsPatterns, text);
    const collectedMatch = findMatch(collectedPatterns, text);

    return {
        url: window.location.href,
        title: document.title || noteTitle,
        noteTitle: noteTitle,
        authorName: authorName,
        authorUrl: authorUrl,
        stats: {
            likes: parseXHSNumber(likesMatch ? likesMatch[1] : null),
            followers: parseXHSNumber(followersMatch ? followersMatch[1] : null),
            follows: parseXHSNumber(followsMatch ? followsMatch[1] : null),
            collected: parseXHSNumber(collectedMatch ? collectedMatch[1] : null)
        },
        // Debug info for troubleshooting
        debug: {
            likesRaw: likesMatch ? likesMatch[0] : null,
            followersRaw: followersMatch ? followersMatch[0] : null,
            extractionTimestamp: new Date().toISOString()
        },
        // Fallback: return a snippet of text for context
        rawSnippet: text.slice(0, 2000).replace(/\s+/g, ' ').trim()
    };
})
