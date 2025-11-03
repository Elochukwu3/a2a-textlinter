import { registerApiRoute } from '@mastra/core/server';

function randomUUID(): string {
    const g: any = globalThis;
    if (g?.crypto && typeof g.crypto.randomUUID === 'function') {
        return g.crypto.randomUUID();
    }

    const getRandomValues = g?.crypto && typeof g.crypto.getRandomValues === 'function'
        ? (arr: Uint8Array) => g.crypto.getRandomValues(arr)
        : (arr: Uint8Array) => {
            for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
            return arr;
        };

    const bytes = new Uint8Array(16);
    getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const toHex = (b: number) => b.toString(16).padStart(2, '0');
    return (
        toHex(bytes[0]) + toHex(bytes[1]) + toHex(bytes[2]) + toHex(bytes[3]) + '-' +
        toHex(bytes[4]) + toHex(bytes[5]) + '-' +
        toHex(bytes[6]) + toHex(bytes[7]) + '-' +
        toHex(bytes[8]) + toHex(bytes[9]) + '-' +
        toHex(bytes[10]) + toHex(bytes[11]) + toHex(bytes[12]) + toHex(bytes[13]) + toHex(bytes[14]) + toHex(bytes[15])
    );
}

interface MessagePart {
    kind: 'text' | 'data';
    text?: string;
    data?: any;
}

interface Message {
    role: 'user' | 'agent';
    content: string;
}

interface A2AParamMessage {
    role: 'user' | 'agent';
    messageId?: string;
    taskId?: string;
    parts: {
        kind: 'text' | 'data';
        text?: string;
        data?: any;
    }[];
}

export const a2aAgentRoute = registerApiRoute('/a2a/agent/:agentId', {
    method: 'POST',
    handler: async (c) => {
        const requestId = (await c.req.json().then(b => b.id).catch(() => null));
        
        try {
            const mastra = c.get('mastra');
            const agentId = c.req.param('agentId');

            const body = await c.req.json();
            const { jsonrpc, method, params } = body;

            if (jsonrpc !== '2.0' || !requestId) {
                return c.json({
                    jsonrpc: '2.0',
                    id: requestId || null,
                    error: {
                        code: -32600,
                        message: 'Invalid Request: jsonrpc must be "2.0" and id is required'
                    }
                }, 400);
            }

            const agent = mastra.getAgent(agentId);
            if (!agent) {
                return c.json({
                    jsonrpc: '2.0',
                    id: requestId,
                    error: {
                        code: -32602,
                        message: `Agent '${agentId}' not found or incorrectly configured in Mastra.`
                    }
                }, 404);
            }

            const { message, messages, contextId, taskId, metadata } = params || {};
            
            const messagesList: A2AParamMessage[] = (message ? [message] : messages) || [];

            const mastraMessages: Message[] = messagesList.map((msg) => ({
                role: msg.role,
                content: msg.parts?.map((part: MessagePart) => {
                    if (part.kind === 'text') return part.text || '';
                    if (part.kind === 'data') return JSON.stringify(part.data);
                    return '';
                }).join('\n') || ''
            }));

            const response = await agent.generate(mastraMessages.map(msg => msg.content));
            const agentText = response.text || '';
            
            const finalTaskId = taskId || randomUUID();
            const finalContextId = contextId || randomUUID();
            const agentMessageId = randomUUID();


            const artifacts = [{
                artifactId: randomUUID(),
                name: `${agentId}Response`,
                parts: [{ kind: 'text', text: agentText }]
            }];
            
            const history = [
                ...messagesList.map((msg) => ({
                    kind: 'message',
                    role: msg.role,
                    parts: msg.parts,
                    messageId: msg.messageId || randomUUID(),
                    taskId: finalTaskId,
                })),
                {
                    kind: 'message',
                    role: 'agent',
                    parts: [{ kind: 'text', text: agentText }],
                    messageId: agentMessageId,
                    taskId: finalTaskId,
                }
            ];
            
            return c.json({
                jsonrpc: '2.0',
                id: requestId,
                result: {
                    id: finalTaskId,
                    contextId: finalContextId,
                    status: {
                        state: 'completed',
                        timestamp: new Date().toISOString(),
                        message: {
                            messageId: agentMessageId,
                            role: 'agent',
                            parts: [{ kind: 'text', text: agentText }],
                            kind: 'message'
                        }
                    },
                    artifacts,
                    history,
                    kind: 'task'
                }
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : `Unknown error: ${String(error)}`;
            const errorId = (typeof requestId === 'number' || typeof requestId === 'string') ? requestId : null; 
            
            return c.json({
                jsonrpc: '2.0',
                id: errorId, 
                error: {
                    code: -32603,
                    message: 'Internal processing error during agent execution.',
                    data: { details: message }
                }
            }, 500);
        }
    }
});