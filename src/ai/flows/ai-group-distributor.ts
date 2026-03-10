'use server';
/**
 * @fileOverview A Genkit flow that helps distribute teams into groups/conferences 
 * based on natural language instructions.
 *
 * - aiGroupDistributor - The main function to trigger the AI-powered group distribution.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIGroupDistributorInputSchema = z.object({
  teams: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
  })).describe('List of teams to be distributed.'),
  instructions: z.string().describe('Instructions for distribution (e.g., "by geography", "balanced rating").'),
  numGroups: z.number().int().min(1).describe('The number of groups required.'),
});
export type AIGroupDistributorInput = z.infer<typeof AIGroupDistributorInputSchema>;

const AIGroupDistributorOutputSchema = z.object({
  groups: z.array(z.object({
    name: z.string().describe('The name of the group/conference.'),
    participantIds: z.array(z.string()).describe('List of team IDs assigned to this group.'),
  })).describe('The generated group distribution.'),
  summary: z.string().describe('A brief explanation of the distribution logic used.'),
});
export type AIGroupDistributorOutput = z.infer<typeof AIGroupDistributorOutputSchema>;

export async function aiGroupDistributor(input: AIGroupDistributorInput): Promise<AIGroupDistributorOutput> {
  return aiGroupDistributorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGroupDistributorPrompt',
  input: {schema: AIGroupDistributorInputSchema},
  output: {schema: AIGroupDistributorOutputSchema},
  prompt: `You are an expert tournament architect. Your task is to distribute the following teams into exactly {{numGroups}} groups.

Teams:
{{#each teams}}
- {{name}} (ID: {{id}}): {{description}}
{{/each}}

User Instructions: {{{instructions}}}

Rules:
1. Every team MUST be assigned to exactly one group.
2. The number of teams per group should be as balanced as possible.
3. Use the User Instructions to determine the logic (geography, alphabetical, thematic, etc.).
4. Provide creative and relevant names for each group based on the logic used.

Return a valid JSON object matching the schema.`,
});

const aiGroupDistributorFlow = ai.defineFlow(
  {
    name: 'aiGroupDistributorFlow',
    inputSchema: AIGroupDistributorInputSchema,
    outputSchema: AIGroupDistributorOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
