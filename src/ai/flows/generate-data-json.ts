
'use server';
/**
 * @fileOverview A Genkit flow that generates a structured JSON object representing 
 * sports entities (teams, players, tournaments) based on natural language instructions.
 *
 * - generateDataJson - The main function to trigger the AI-powered data generation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDataJsonInputSchema = z.object({
  instructions: z.string().describe('Instructions for the AI, e.g., "Create 4 teams from the Spanish league with their 3 best players each".'),
});
export type GenerateDataJsonInput = z.infer<typeof GenerateDataJsonInputSchema>;

const GenerateDataJsonOutputSchema = z.object({
  teams: z.array(z.any()).describe('List of generated Team objects.'),
  players: z.array(z.any()).describe('List of generated Player objects.'),
  tournaments: z.array(z.any()).describe('List of generated Tournament objects.'),
  summary: z.string().describe('A brief summary of what was generated.'),
});
export type GenerateDataJsonOutput = z.infer<typeof GenerateDataJsonOutputSchema>;

export async function generateDataJson(input: GenerateDataJsonInput): Promise<GenerateDataJsonOutput> {
  return generateDataJsonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDataJsonPrompt',
  input: {schema: GenerateDataJsonInputSchema},
  output: {schema: GenerateDataJsonOutputSchema},
  prompt: `You are an expert sports data architect. Your task is to generate a valid JSON package containing Teams, Players, and optionally a Tournament based on user instructions.

Follow these rules strictly:
1. IDs must be unique strings (e.g., random 9-character alphanumeric).
2. Use the following 36 predefined HSL/Hex colors for any color fields: 
   #ef4444, #b91c1c, #7f1d1d, #f43f5e, #be123c, #ec4899, #f97316, #c2410c, #f59e0b, #b45309, #eab308, #a16207, #84cc16, #4d7c0f, #22c55e, #15803d, #10b981, #047857, #14b8a6, #0f766e, #06b6d4, #0e7490, #0ea5e9, #0369a1, #3b82f6, #1d4ed8, #1e3a8a, #6366f1, #4338ca, #8b5cf6, #6d28d9, #a855f7, #d946ef, #475569, #0a0a0a, #ffffff.
3. Teams should have: name, abbreviation (3 chars), rating (1-100), emblemShape, emblemPattern, crestPrimary, crestSecondary, venueName, venueCapacity, venueSurface, venueSize.
4. Players should have: name, monetaryValue, jerseyNumber, position, attributes (array of {name, value}), uniformStyle, kitPrimary, kitSecondary, crestPlacement, sponsorPlacement, brandPlacement, crestSize.
5. If the instructions imply a specific sport, set it in the tournament if one is created.

Instructions: {{{instructions}}}

Provide the output as a clean JSON object according to the schema.`,
});

const generateDataJsonFlow = ai.defineFlow(
  {
    name: 'generateDataJsonFlow',
    inputSchema: GenerateDataJsonInputSchema,
    outputSchema: GenerateDataJsonOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
