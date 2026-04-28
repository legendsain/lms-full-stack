import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMindMapPrompt, getRepairPrompt } from '../prompts/mindmap.prompt.js';
import { validateMindMapData } from '../utils/mindmapSchema.js';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const PRIMARY_MODEL_NAME = "gemini-2.5-flash-lite";
const FALLBACK_MODEL_NAME = "gemini-1.5-flash";
const primaryModel = genAI.getGenerativeModel({ model: PRIMARY_MODEL_NAME });
const fallbackModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL_NAME });

// Simple in-memory cache. For production, use Redis.
const cache = new Map();

// Generate a cache key
const getCacheKey = (topic, audience, goal, depth) => {
    return crypto.createHash('sha256').update(`${topic}|${audience}|${goal}|${depth}`).digest('hex');
};

const callLLMWithTimeout = async (prompt, modelInstance) => {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI is taking too long. Please try again.")), 25000)
    );
    const result = await Promise.race([modelInstance.generateContent(prompt), timeoutPromise]);
    let text = result.response.text();
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    return text;
};

const isServiceUnavailableError = (error) => {
    const status = error?.status || error?.response?.status || error?.cause?.status;
    const message = (error?.message || "").toLowerCase();
    return status === 503 || message.includes("503") || message.includes("service unavailable") || message.includes("high demand");
};

// -----------------------------------------------------------------------------
// POST-PROCESSING PIPELINE
// -----------------------------------------------------------------------------

const assertSingleRoot = (data) => {
    const roots = data.nodes.filter(n => n.type === 'root');
    if (roots.length === 0) {
        // Create a root if missing
        const root = {
            id: 'root', type: 'root', data: { label: data.topic || 'Root', type: 'root', level: 0 }
        };
        data.nodes.unshift(root);
        // Connect branches to new root
        data.nodes.filter(n => n.type === 'branch').forEach(b => {
            data.edges.push({ id: `e-root-${b.id}`, source: 'root', target: b.id });
        });
    } else if (roots.length > 1) {
        // Keep first, convert others to branches
        for (let i = 1; i < roots.length; i++) {
            roots[i].type = 'branch';
            roots[i].data.type = 'branch';
            roots[i].data.level = 1;
        }
    }
};

const deduplicateNodes = (data) => {
    const seen = new Set();
    const uniqueNodes = [];
    const idMap = {}; // oldId -> newId

    data.nodes.forEach(node => {
        const normalized = node.data.label.trim().toLowerCase();
        if (!seen.has(normalized)) {
            seen.add(normalized);
            uniqueNodes.push(node);
            idMap[node.id] = node.id;
        } else {
            // Find the one we kept
            const kept = uniqueNodes.find(n => n.data.label.trim().toLowerCase() === normalized);
            idMap[node.id] = kept.id;
        }
    });

    data.nodes = uniqueNodes;
    // Remap edges
    data.edges = data.edges.map(e => ({
        ...e,
        source: idMap[e.source],
        target: idMap[e.target]
    })).filter(e => e.source && e.target && e.source !== e.target);
};

const enforceParentEdges = (data) => {
    const root = data.nodes.find(n => n.type === 'root');
    if (!root) return;
    
    data.nodes.forEach(node => {
        if (node.type === 'root') return;
        
        // Find if this node is a target in any edge
        const hasParent = data.edges.some(e => e.target === node.id);
        if (!hasParent) {
            // Force connection to root as a fallback
            data.edges.push({
                id: `e-${root.id}-${node.id}`,
                source: root.id,
                target: node.id
            });
        }
    });
};

const pruneOrphans = (data) => {
    const root = data.nodes.find(n => n.type === 'root');
    if (!root) return;

    const visited = new Set();
    const queue = [root.id];
    
    while(queue.length > 0) {
        const current = queue.shift();
        if (!visited.has(current)) {
            visited.add(current);
            const children = data.edges.filter(e => e.source === current).map(e => e.target);
            queue.push(...children);
        }
    }

    data.nodes = data.nodes.filter(n => visited.has(n.id));
    data.edges = data.edges.filter(e => visited.has(e.source) && visited.has(e.target));
};

const capDepthAndBreadth = (data, maxDepth = 4, maxChildren = 7) => {
    // A simple BFS to assign true depth and prune excessive children
    const root = data.nodes.find(n => n.type === 'root');
    if (!root) return;

    const queue = [{ id: root.id, depth: 0 }];
    const keptNodeIds = new Set([root.id]);
    const keptEdges = [];

    while (queue.length > 0) {
        const { id, depth } = queue.shift();
        
        if (depth >= maxDepth) continue;

        let childEdges = data.edges.filter(e => e.source === id);
        // Cap breadth
        if (childEdges.length > maxChildren) {
            childEdges = childEdges.slice(0, maxChildren);
        }

        childEdges.forEach(e => {
            if (!keptNodeIds.has(e.target)) {
                keptNodeIds.add(e.target);
                keptEdges.push(e);
                queue.push({ id: e.target, depth: depth + 1 });
            }
        });
    }

    data.nodes = data.nodes.filter(n => keptNodeIds.has(n.id));
    data.edges = keptEdges;
};

const assignStableIds = (data) => {
    const idMap = {};
    const root = data.nodes.find(n => n.type === 'root');
    if (root) {
        idMap[root.id] = 'root';
        root.id = 'root';
    }

    let branchCount = 1;
    let subBranchCount = 1;
    let leafCount = 1;

    data.nodes.forEach(node => {
        if (node.type === 'root') return;
        const oldId = node.id;
        
        if (node.type === 'branch') {
            node.id = `b${branchCount++}-${node.data.label.replace(/\W+/g, '-').toLowerCase()}`;
        } else if (node.type === 'subBranch') {
            node.id = `sb${subBranchCount++}-${node.data.label.replace(/\W+/g, '-').toLowerCase()}`;
        } else {
            node.id = `l${leafCount++}-${node.data.label.replace(/\W+/g, '-').toLowerCase()}`;
        }
        idMap[oldId] = node.id;
    });

    data.edges.forEach(e => {
        e.source = idMap[e.source] || e.source;
        e.target = idMap[e.target] || e.target;
        e.id = `e-${e.source}-${e.target}`;
    });
};

const computeMeta = (data, modelName = PRIMARY_MODEL_NAME) => {
    let maxDepth = 0;
    const branches = data.nodes.filter(n => n.type === 'branch').length;
    
    // Calculate max depth
    const root = data.nodes.find(n => n.type === 'root');
    if (root) {
        const getDepth = (nodeId, currentDepth) => {
            maxDepth = Math.max(maxDepth, currentDepth);
            const children = data.edges.filter(e => e.source === nodeId).map(e => e.target);
            children.forEach(c => getDepth(c, currentDepth + 1));
        };
        getDepth(root.id, 0);
    }

    data.meta = {
        createdAt: new Date().toISOString(),
        model: modelName,
        depth: maxDepth,
        breadth: branches
    };
};

// -----------------------------------------------------------------------------
// MAIN SERVICE EXPORT
// -----------------------------------------------------------------------------
export const generateMindMapService = async ({ topic, audience = "general students", goal = "comprehensive understanding", depth = 3 }) => {
    const cacheKey = getCacheKey(topic, audience, goal, depth);
    if (cache.has(cacheKey)) {
        console.log("Serving MindMap from cache");
        return cache.get(cacheKey);
    }

    let prompt = getMindMapPrompt(topic, audience, goal, depth);
    let rawJsonText = "";
    let data = null;
    let retries = 0;
    const maxRetries = 2;
    let activeModel = primaryModel;
    let activeModelName = PRIMARY_MODEL_NAME;

    while (retries <= maxRetries) {
        try {
            rawJsonText = await callLLMWithTimeout(prompt, activeModel);
            const parsed = JSON.parse(rawJsonText);
            
            const validation = validateMindMapData(parsed);
            if (validation.success) {
                data = validation.data;
                break; // Success!
            } else {
                throw new Error("Zod Validation Failed: " + validation.error.message);
            }
        } catch (error) {
            console.error(`Attempt ${retries + 1} failed:`, error.message);
            retries++;
            if (retries <= maxRetries) {
                if (isServiceUnavailableError(error) && activeModelName !== FALLBACK_MODEL_NAME) {
                    console.warn(`Primary model unavailable (503/high-demand). Switching to fallback model: ${FALLBACK_MODEL_NAME}`);
                    activeModel = fallbackModel;
                    activeModelName = FALLBACK_MODEL_NAME;
                    // Keep original prompt for transport-level failures.
                } else {
                    prompt = getRepairPrompt(error.message, rawJsonText);
                }
            } else {
                throw new Error("Failed to generate valid MindMap after maximum retries.");
            }
        }
    }

    // Post-Processing Pipeline
    try {
        assertSingleRoot(data);
        deduplicateNodes(data);
        enforceParentEdges(data);
        pruneOrphans(data);
        capDepthAndBreadth(data, 4, 7);
        assignStableIds(data);
        computeMeta(data, activeModelName);

        // Save to cache
        cache.set(cacheKey, data);
        return data;

    } catch (pipelineError) {
        console.error("Post-processing pipeline failed:", pipelineError);
        throw new Error("Failed to sanitize and process the MindMap data.");
    }
};
