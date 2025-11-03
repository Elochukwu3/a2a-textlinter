
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const securityScannerTool = createTool({
    id: 'securityScanner',
    description: 'Scans code for common security vulnerabilities like hardcoded secrets or risky function calls. Returns a list of potential issues.',
    
    inputSchema: z.object({ 
        code: z.string().describe("The code snippet to be analyzed for security risks.") 
    }),

    outputSchema: z.object({
        issues: z.array(z.string()).describe("A list of security issues found, or an empty array if none are found.")
    }),

    execute: async ({ context }) => {
        const { code } = context;
        const issues = [];
        const lowerCaseCode = code.toLowerCase();

        if (code.includes('API_KEY =') || code.includes('PASSWORD =')) {
            issues.push('Potential hardcoded secret (API_KEY/PASSWORD) detected.');
        }

        if (lowerCaseCode.includes('eval(')) {
            issues.push('Use of the "eval()" function, which can execute arbitrary code, is a high-risk security flaw.');
        }
        
        if (lowerCaseCode.includes('db.execute(`select') || lowerCaseCode.includes('sqlite3.cursor.execute(')) {
            if (code.includes(' + user_input') || code.includes(`' + req.body`)) {
                issues.push('Unsafe string concatenation used to build a database query, posing a risk of SQL injection.');
            }
        }

        return { issues };
    },
});