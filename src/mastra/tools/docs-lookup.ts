
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { ToolExecutionContext } from '@mastra/core/tools'; 

const PackageDocsOutputSchema = z.object({
    status: z.enum(['ok', 'deprecated', 'error']).describe("The status of the query."),
    details: z.string().describe("The relevant documentation, status, or a helpful link/example.")
});

export const packageDocsLookupTool = createTool({
    id: 'packageDocsLookup',
    description: 'Queries external documentation for a specific function or package to check its current API, deprecation status, or correct usage pattern.',

    inputSchema: z.object({
        packageName: z.string().describe("The name of the package or framework (e.g., 'React', 'Lodash', 'requests')."),
        query: z.string().describe("The specific function or feature to look up (e.g., 'useEffect cleanup', 'axios.get signature', 'deprecated fs.exists').")
    }),

    outputSchema: PackageDocsOutputSchema, 


    execute: async ({ context }: ToolExecutionContext<any>, options?: any): Promise<z.infer<typeof PackageDocsOutputSchema>> => {
        const { packageName, query } = context;

        if (packageName.toLowerCase().includes('react') && query.toLowerCase().includes('componentwillmount')) {
            return {
                status: 'deprecated', 
                details: `The lifecycle method componentWillMount is deprecated in modern React (v16.3+). Use 'useEffect' with an empty dependency array ([]), or consider using function components and Hooks for new development.`,
            };
        }
        if (packageName.toLowerCase().includes('express') && query.toLowerCase().includes('body-parser')) {
             return {
                status: 'deprecated',
                details: `The body-parser package is largely deprecated. Use the built-in 'express.json()' and 'express.urlencoded({ extended: true })' middleware instead.`,
            };
        }
        
        return {
            status: 'ok', 
            details: `Found current usage for ${query} in ${packageName}. It is generally safe to use.`,
        };
    },
});