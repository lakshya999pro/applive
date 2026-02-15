const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

app.use(cors({
    origin: 'https://lighthearted-sfogliatella-c38e5d.netlify.app'
}));
// SK Tech Decryption Configuration
const AES_KEY = Buffer.from('l2l5kB7xC5qP1rK1', 'utf8');
const AES_IV = Buffer.from('p1K5nP7uB8hH1l19', 'utf8');

const LOOKUP_TABLE_D = 
    "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\u000c\r\u000e\u000f" +
    "\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f" +
    " !\"#$%&'()*+,-./" +
    "0123456789:;<=>?" +
    "@EGMNKABUVCDYHLI" +
    "FPOZQSRWTXJ[\\]^_" +
    "`egmnkabuvcdyhli" +
    "fpozqsrwtxj{|}~\u007f";

// Serve static files
app.use(express.static('public'));

/**
 * Convert custom base64 to standard base64 using lookup table
 */
function customToStandardBase64(customB64) {
    let result = '';
    for (let i = 0; i < customB64.length; i++) {
        const asciiVal = customB64.charCodeAt(i);
        if (asciiVal < LOOKUP_TABLE_D.length) {
            result += LOOKUP_TABLE_D[asciiVal];
        } else {
            result += customB64[i];
        }
    }
    return result;
}

/**
 * Complete SK Tech decryption pipeline
 */
function decryptSKLive(encryptedData) {
    try {
        // Step 1: Custom base64 → Standard base64
        const standardB64 = customToStandardBase64(encryptedData);
        
        // Step 2: Base64 decode → intermediate string
        const decoded = Buffer.from(standardB64, 'base64').toString('utf8');
        
        // Step 3: REVERSE the string (critical step!)
        const reversedStr = decoded.split('').reverse().join('');
        
        // Step 4: Base64 decode → AES ciphertext
        const ciphertext = Buffer.from(reversedStr, 'base64');
        
        // Step 5: AES-CBC decrypt → JSON plaintext
        const decipher = crypto.createDecipheriv('aes-128-cbc', AES_KEY, AES_IV);
        decipher.setAutoPadding(true);
        
        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption error:', error.message);
        throw error;
    }
}

/**
 * Fetch and decrypt a link URL from pro/*.txt file
 */
async function fetchAndDecryptLink(linkPath) {
    if (!linkPath) return null;
    
    try {
        // Construct full URL: https://sufyanpromax.space/pro/VDIw...txt
        const fullUrl = `https://matkeritnagurorxbxb.store/${linkPath}`;
        console.log(`Fetching link from: ${fullUrl}`);
        
        const response = await axios.get(fullUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });
        
        const encryptedData = response.data.trim();
        
        // Decrypt the link data
        const decryptedData = decryptSKLive(encryptedData);
        console.log(`Decrypted link: ${decryptedData.substring(0, 100)}...`);
        
        return decryptedData;
    } catch (error) {
        console.error(`Error fetching link ${linkPath}:`, error.message);
        return null;
    }
}

/**
 * Parse datetime from SK Tech format to Indian Standard Time (IST)
 */
function parseDateTime(date, time) {
    if (!date || !time) return null;
    try {
        // SK Tech format: date="23/01/2026", time="13:30:00" (assumed UTC)
        const [day, month, year] = date.split('/');
        
        // Create UTC date
        const utcDateTime = new Date(`${year}-${month}-${day}T${time}Z`);
        
        // Convert to IST (UTC+5:30)
        const istDateTime = new Date(utcDateTime.getTime() + (5.5 * 60 * 60 * 1000));
        
        // Format as readable IST string
        const istYear = istDateTime.getUTCFullYear();
        const istMonth = String(istDateTime.getUTCMonth() + 1).padStart(2, '0');
        const istDay = String(istDateTime.getUTCDate()).padStart(2, '0');
        const istHours = String(istDateTime.getUTCHours()).padStart(2, '0');
        const istMinutes = String(istDateTime.getUTCMinutes()).padStart(2, '0');
        const istSeconds = String(istDateTime.getUTCSeconds()).padStart(2, '0');
        
        return `${istYear}-${istMonth}-${istDay} ${istHours}:${istMinutes}:${istSeconds} IST`;
    } catch (e) {
        console.error('Failed to parse date/time:', date, time);
        return null;
    }
}

// API Endpoints

/**
 * Fetch and decrypt events from SK Tech API
 */
app.get('/api/events', async (req, res) => {
    try {
        console.log('Fetching events from SK Tech API...');
        
        const response = await axios.get('https://matkeritnagurorxbxb.store/events.txt', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });
        
        const encryptedData = response.data.trim();
        console.log(`Received encrypted data: ${encryptedData.length} characters`);
        
        // Decrypt the data
        const decryptedData = decryptSKLive(encryptedData);
        console.log('Decryption successful');
        
        // Parse the JSON wrappers
        const wrappers = JSON.parse(decryptedData);
        
        // Parse each event and transform to structured format
        const events = wrappers.map((wrapper, index) => {
            const eventData = JSON.parse(wrapper.event);
            
            // Convert times to IST
            const getISTTime = (date, time) => {
                if (!date || !time) return null;
                try {
                    const [day, month, year] = date.split('/');
                    const utcDateTime = new Date(`${year}-${month}-${day}T${time}Z`);
                    const istDateTime = new Date(utcDateTime.getTime() + (5.5 * 60 * 60 * 1000));
                    const hours = String(istDateTime.getUTCHours()).padStart(2, '0');
                    const minutes = String(istDateTime.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(istDateTime.getUTCSeconds()).padStart(2, '0');
                    return `${hours}:${minutes}:${seconds}`;
                } catch (e) {
                    return time;
                }
            };
            
            return {
                id: index + 1,
                eventName: eventData.eventName || 'Unknown Event',
                category: eventData.category,
                eventLogo: eventData.eventLogo,
                teamA: {
                    name: eventData.teamAName,
                    flag: eventData.teamAFlag
                },
                teamB: {
                    name: eventData.teamBName,
                    flag: eventData.teamBFlag
                },
                schedule: {
                    startDate: eventData.date,
                    startTime: getISTTime(eventData.date, eventData.time),
                    endDate: eventData.end_date,
                    endTime: getISTTime(eventData.end_date, eventData.end_time),
                    startDateTime: parseDateTime(eventData.date, eventData.time),
                    endDateTime: parseDateTime(eventData.end_date, eventData.end_time)
                },
                links: eventData.links,  // Keep encrypted path as-is
                linkNames: eventData.link_names || [],
                visible: eventData.visible === true,
                priority: eventData.priority || 0
            };
        });
        
        // Filter only visible events and sort by priority
        const visibleEvents = events
            .filter(event => event.visible)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
        
        console.log(`Successfully parsed ${visibleEvents.length} visible events`);
        
        res.json({
            success: true,
            count: visibleEvents.length,
            events: visibleEvents
        });
        
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Fetch and decrypt categories from SK Tech API
 */
app.get('/api/categories', async (req, res) => {
    try {
        console.log('Fetching categories from SK Tech API...');
        
        const response = await axios.get('https://matkeritnagurorxbxb.store/categories.txt', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });
        
        const encryptedData = response.data.trim();
        console.log(`Received encrypted data: ${encryptedData.length} characters`);
        
        // Decrypt the data
        const decryptedData = decryptSKLive(encryptedData);
        console.log('Decryption successful');
        
        // Parse the JSON wrappers
        const wrappers = JSON.parse(decryptedData);
        
        // Parse each category
        const categories = wrappers.map((wrapper, index) => {
            const categoryData = JSON.parse(wrapper.cat);
            
            return {
                id: index + 1,
                name: categoryData.name,
                logo: categoryData.logo,
                type: categoryData.type,
                api: categoryData.api,
                visible: categoryData.visible !== false
            };
        });
        
        // Filter only visible categories
        const visibleCategories = categories.filter(cat => cat.visible);
        
        console.log(`Successfully parsed ${visibleCategories.length} visible categories`);
        
        res.json({
            success: true,
            count: visibleCategories.length,
            categories: visibleCategories
        });
        
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Decrypt a specific link URL
 * GET /api/decrypt-link?path=pro/VDIw...txt
 */
app.get('/api/decrypt-link', async (req, res) => {
    try {
        const linkPath = req.query.path;
        
        if (!linkPath) {
            return res.status(400).json({
                success: false,
                error: 'Missing link path parameter'
            });
        }
        
        console.log(`Decrypting link: ${linkPath}`);
        
        const decryptedUrl = await fetchAndDecryptLink(linkPath);
        
        if (!decryptedUrl) {
            return res.status(404).json({
                success: false,
                error: 'Failed to decrypt link'
            });
        }
        
        res.json({
            success: true,
            originalPath: linkPath,
            decryptedUrl: decryptedUrl
        });
        
    } catch (error) {
        console.error('Error in decrypt-link endpoint:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ SK Tech Events Server running on http://localhost:${PORT}`);
    console.log(`📡 API Endpoints:`);
    console.log(`   - GET /api/events`);
    console.log(`   - GET /api/categories`);
    console.log(`   - GET /api/decrypt-link?path=pro/...txt`);
});
