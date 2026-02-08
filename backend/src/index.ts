import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for dev tunnel support
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to fetch GitHub profile
async function fetchGitHubProfile(url: string): Promise<string> {
    try {
        const username = url.split('/').pop();
        if (!username) return '';

        const apiUrl = `https://api.github.com/users/${username}`;
        const reposUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`;

        const [profileRes, reposRes] = await Promise.all([
            axios.get(apiUrl),
            axios.get(reposUrl)
        ]);

        const profile = profileRes.data;
        const repos = reposRes.data;

        let data = `GitHub Profile: ${profile.name || username}\n`;
        data += `Bio: ${profile.bio || 'No bio'}\n`;
        data += `Top Repositories:\n`;
        repos.forEach((repo: any) => {
            data += `- ${repo.name}: ${repo.description || 'No description'} (Language: ${repo.language})\n`;
        });

        return data;
    } catch (error) {
        console.error('Error fetching GitHub profile:', error);
        return '';
    }
}

// Helper function to fetch LinkedIn profile (Best Effort Scraper)
async function fetchLinkedInProfile(url: string): Promise<string> {
    try {
        // LinkedIn scraping is difficult without an API. 
        // We will try to fetch the public page and extract meta tags/basic info.
        // For a hackathon/demo, this might be limited.
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const name = $('meta[property="og:title"]').attr('content') || '';
        const description = $('meta[property="og:description"]').attr('content') || '';

        return `LinkedIn Profile: ${name}\nDescription: ${description}\n`;
    } catch (error) {
        console.error('Error fetching LinkedIn profile:', error);
        return '';
    }
}

// Helper function to generate interests using Gemini
async function generateInterests(profileData: string): Promise<string[]> {
    try {
        // Use gemini-1.5-flash for better performance and availability
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const prompt = `
            Analyze the following developer profile data and suggest 5-10 technical interests or topics they would be interested in discussing.
            Return ONLY a comma-separated list of interests. Do not include any other text.
            
            Profile Data:
            ${profileData}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("--- AI Raw Response ---");
        console.log(text);
        console.log("-----------------------");

        return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } catch (error) {
        console.error('Error generating interests:', error);
        return [];
    }
}

// API Endpoint to suggest interests
app.post('/api/suggest-interests', async (req, res) => {
    try {
        const { githubUrl } = req.body;
        let profileData = '';

        if (githubUrl) {
            profileData += await fetchGitHubProfile(githubUrl);
        }

        if (!profileData.trim()) {
            res.status(400).json({ error: 'Could not fetch data from provided URL' });
            return;
        }

        console.log("--- Scraped Profile Data ---");
        console.log(profileData);
        console.log("----------------------------");

        const interests = await generateInterests(profileData);
        res.json({ interests });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

// User waiting with their interests
interface WaitingUser {
    socketId: string;
    interests: string[];
}

// Queue of users waiting to be matched
const waitingQueue: WaitingUser[] = [];

// Map to track which users are paired together
const pairs: Map<string, string> = new Map();

// Map to track user interests for displaying to partners
const userInterests: Map<string, string[]> = new Map();

// Calculate match score based on common interests
function calculateMatchScore(interests1: string[], interests2: string[]): number {
    const set1 = new Set(interests1);
    let commonCount = 0;
    for (const interest of interests2) {
        if (set1.has(interest)) {
            commonCount++;
        }
    }
    return commonCount;
}

// Find best match from waiting queue
function findBestMatch(interests: string[]): WaitingUser | null {
    if (waitingQueue.length === 0) return null;

    let bestMatch: WaitingUser | null = null;
    let bestScore = -1;
    let bestIndex = -1;

    for (let i = 0; i < waitingQueue.length; i++) {
        const candidate = waitingQueue[i];
        const score = calculateMatchScore(interests, candidate.interests);

        // Prefer higher match score, but accept any match
        if (score > bestScore) {
            bestScore = score;
            bestMatch = candidate;
            bestIndex = i;
        }
    }

    // Remove matched user from queue
    if (bestIndex !== -1) {
        waitingQueue.splice(bestIndex, 1);
    }

    return bestMatch;
}

io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining the queue with interests
    socket.on('join_queue', (data: { interests: string[] }) => {
        const interests = data?.interests || [];
        console.log(`User ${socket.id} joining queue with interests:`, interests);

        // Store user interests
        userInterests.set(socket.id, interests);

        // Try to find a match
        const match = findBestMatch(interests);

        if (match) {
            // Store the pairing
            pairs.set(socket.id, match.socketId);
            pairs.set(match.socketId, socket.id);

            // Get common interests
            const commonInterests = interests.filter(i => match.interests.includes(i));
            console.log(`Matched ${socket.id} with ${match.socketId}. Common interests:`, commonInterests);

            // Notify both users they've been matched
            socket.emit('matched', {
                partnerId: match.socketId,
                isInitiator: false,
                partnerInterests: match.interests,
                commonInterests
            });
            io.to(match.socketId).emit('matched', {
                partnerId: socket.id,
                isInitiator: true,
                partnerInterests: interests,
                commonInterests
            });
        } else {
            // Add to waiting queue
            waitingQueue.push({ socketId: socket.id, interests });
            socket.emit('waiting');
            console.log(`User ${socket.id} added to queue. Queue size: ${waitingQueue.length}`);
        }
    });

    // Handle WebRTC offer
    socket.on('offer', (data: { offer: any; to: string }) => {
        console.log(`Offer from ${socket.id} to ${data.to}`);
        io.to(data.to).emit('offer', { offer: data.offer, from: socket.id });
    });

    // Handle WebRTC answer
    socket.on('answer', (data: { answer: any; to: string }) => {
        console.log(`Answer from ${socket.id} to ${data.to}`);
        io.to(data.to).emit('answer', { answer: data.answer, from: socket.id });
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (data: { candidate: any; to: string }) => {
        io.to(data.to).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
    });

    // Handle skip - disconnect from current partner and rejoin queue
    socket.on('skip', () => {
        const partnerId = pairs.get(socket.id);

        if (partnerId) {
            // Notify partner they've been skipped
            io.to(partnerId).emit('partner_left');

            // Clear the pairing
            pairs.delete(socket.id);
            pairs.delete(partnerId);
        }

        // Remove from waiting queue if present
        const queueIndex = waitingQueue.findIndex(u => u.socketId === socket.id);
        if (queueIndex > -1) {
            waitingQueue.splice(queueIndex, 1);
        }

        // Rejoin the queue
        socket.emit('skip_confirmed');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // Remove from waiting queue if present
        const queueIndex = waitingQueue.findIndex(u => u.socketId === socket.id);
        if (queueIndex > -1) {
            waitingQueue.splice(queueIndex, 1);
            console.log(`Removed ${socket.id} from queue. Queue size: ${waitingQueue.length}`);
        }

        // Notify partner if paired
        const partnerId = pairs.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit('partner_left');
            pairs.delete(partnerId);
            pairs.delete(socket.id);
            console.log(`Notified partner ${partnerId} about disconnect`);
        }

        // Clean up user interests
        userInterests.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
