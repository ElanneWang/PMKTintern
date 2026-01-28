/**
 * Scans the Xiaohongshu explore feed for notes matching criteria.
 * Automates scrolling and DOM extraction with human-mimicking behaviors
 * to reduce bot detection risk while saving tokens.
 *
 * Enhanced to extract author URLs for deduplication.
 *
 * Usage in Claude:
 * await evaluate_script({ script: <content_of_this_file>, args: { maxScrolls: 5 } })
 */
(async function(args) {
    const maxScrolls = args?.maxScrolls || 5;
    const baseInterval = 2000; // Slower base interval
    const notes = [];
    const seenUrls = new Set();

    // Helper to sleep with randomization (jitter)
    const wait = (ms) => new Promise(resolve => {
        const jitter = ms * 0.3 * (Math.random() - 0.5); // +/- 15% jitter
        setTimeout(resolve, ms + jitter);
    });

    // Human-like smooth scroll
    const smoothScroll = async (distance) => {
        const steps = 10 + Math.floor(Math.random() * 10); // 10-20 steps
        const stepSize = distance / steps;
        for (let i = 0; i < steps; i++) {
            // Add slight randomness to each step
            const currentStep = stepSize * (0.8 + Math.random() * 0.4);
            window.scrollBy(0, currentStep);
            await wait(30 + Math.random() * 50); // 30-80ms between steps
        }
    };

    // Helper to extract author URL from a note card
    const extractAuthorUrl = (card) => {
        // Look for author link in the card
        const authorLinks = card.querySelectorAll('a[href*="/user/profile/"]');
        for (const link of authorLinks) {
            const href = link.getAttribute('href');
            if (href && href.includes('/user/profile/')) {
                // Clean up URL (remove query params)
                return href.split('?')[0];
            }
        }
        return null;
    };

    // Helper to extract likes count from text
    const extractLikes = (text) => {
        // Match patterns like "93赞", "1.2万赞", "100赞"
        const match = text.match(/(\d+[\d.,]*[万wW]?)\s*[,，]?\s*赞/);
        if (!match) return null;

        const numStr = match[1];
        let multiplier = 1;
        if (numStr.includes('万') || numStr.match(/[wW]$/)) {
            multiplier = 10000;
        }
        const value = parseFloat(numStr.replace(/[^\d.]/g, ''));
        return isNaN(value) ? null : value * multiplier;
    };

    console.log(`Starting human-mimicking scan with ${maxScrolls} scrolls...`);

    for (let i = 0; i < maxScrolls; i++) {
        // Randomize scroll distance (screensize variance)
        const scrollDist = 600 + Math.floor(Math.random() * 400);
        await smoothScroll(scrollDist);

        // Wait for content load with human-like pause
        await wait(baseInterval + Math.random() * 1000);

        // Find note cards using multiple selectors
        const selectors = [
            'section',
            '.feed-card',
            '[class*="note-card"]',
            '[class*="feed-item"]',
            'article'
        ];

        let cards = [];
        for (const sel of selectors) {
            const found = document.querySelectorAll(sel);
            if (found.length > 0) {
                cards = Array.from(found);
                break;
            }
        }

        // Fallback: use explore links as anchors
        if (cards.length === 0) {
            const links = Array.from(document.querySelectorAll('a[href*="/explore/"]'));
            cards = links.map(link => link.closest('section') || link.closest('div') || link.parentElement);
        }

        cards.forEach(card => {
            if (!card) return;

            // Get the main note link
            const noteLink = card.querySelector('a[href*="/explore/"]');
            if (!noteLink) return;

            const url = noteLink.href;
            if (seenUrls.has(url)) return;

            const text = card.innerText || "";
            const likes = extractLikes(text);

            // Only add cards with extractable data
            if (url && text.trim()) {
                const authorUrl = extractAuthorUrl(card);

                // Add bounding box check - only process visible elements
                const rect = card.getBoundingClientRect();
                const isVisible = rect.top >= -100 && rect.bottom <= window.innerHeight * 2;

                if (isVisible) {
                    const noteData = {
                        url: url,
                        title: noteLink.innerText || text.split('\n')[0],
                        rawText: text.replace(/\s+/g, ' ').trim(),
                        elementSelector: `a[href="${url.replace(location.origin, '')}"]`,
                        likes: likes,
                        authorUrl: authorUrl
                    };

                    notes.push(noteData);
                    seenUrls.add(url);
                }
            }
        });

        console.log(`Scroll ${i + 1}/${maxScrolls}: Found ${notes.length} notes so far`);

        // Occasional long pause (simulating reading)
        if (Math.random() < 0.2) {
            await wait(2000 + Math.random() * 2000);
        }
    }

    return {
        scannedCount: notes.length,
        notes: notes.slice(0, 50),
        seenAuthorUrls: Array.from(new Set(notes.filter(n => n.authorUrl).map(n => n.authorUrl)))
    };
})
