'use server';
/**
 * @fileOverview A Genkit flow that takes a natural language description of a tournament
 * and pre-configures its settings into a structured format.
 *
 * - aiPoweredTournamentSetup - The main function to trigger the AI-powered tournament setup.
 * - AITournamentSetupInput - The input type for the aiPoweredTournamentSetup function.
 * - AITournamentSetupOutput - The return type for the aiPoweredTournamentSetup function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AITournamentSetupInputSchema = z.object({
  tournamentDescription: z
    .string()
    .describe(
      'A natural language description of the desired tournament, e.g., "a 16-team soccer league with a playoff round".'
    ),
});
export type AITournamentSetupInput = z.infer<
  typeof AITournamentSetupInputSchema
>;

const ScoringRulesSchema = z
  .object({
    type: z
      .enum(['nToNRange', 'bestOfN', 'firstToN'])
      .describe('Type of scoring rule.'),
    nToNRangeMin: z
      .number()
      .int()
      .optional()
      .describe('Minimum sum of total results for "nToNRange" type.'),
    nToNRangeMax: z
      .number()
      .int()
      .optional()
      .describe('Maximum sum of total results for "nToNRange" type.'),
    bestOfNValue: z
      .number()
      .int()
      .optional()
      .describe('Value N for "bestOfN" type (first to N ends the match).'),
    firstToNValue: z
      .number()
      .int()
      .optional()
      .describe('Value N for "firstToN" type (first to N wins).'),
  })
  .describe('Defines how scores are simulated and determine the winner.');

const LeagueDetailsSchema = z
  .object({
    type: z
      .enum(['single-table', 'groups', 'conferences'])
      .describe('Type of league format.'),
    dualLeagueEnabled: z
      .boolean()
      .optional()
      .describe(
        'Whether a dual league is enabled (only for Arcade mode leagues).'
      ),
  })
  .describe('Details specific to league tournaments.');

const InitialTeamEconomicsSchema = z
  .object({
    winAmount: z
      .number()
      .int()
      .describe('Base amount teams earn for a win in credits.'),
    lossAmount: z
      .number()
      .int()
      .describe('Base amount teams lose for a loss in credits.'),
    drawAmount: z
      .number()
      .int()
      .describe('Base amount teams earn/lose for a draw in credits.'),
    minChangePercentage: z
      .number()
      .int()
      .min(0)
      .max(100)
      .describe(
        'Minimum percentage (0-100) by which economic amounts can unpredictably change per match.'
      ),
    maxChangePercentage: z
      .number()
      .int()
      .min(0)
      .max(100)
      .describe(
        'Maximum percentage (0-100) by which economic amounts can unpredictably change per match.'
      ),
  })
  .describe('Initial economic settings for teams in the tournament.');

const AITournamentSetupOutputSchema = z
  .object({
    tournamentName: z
      .string()
      .describe('Suggested name for the tournament. Infer from description or generate a suitable one.'),
    sport: z
      .string()
      .describe('The sport played in the tournament (e.g., "soccer", "basketball").'),
    numTeams: z
      .number()
      .int()
      .min(2)
      .describe('The number of teams participating in the tournament.'),
    mode: z
      .enum(['normal', 'arcade'])
      .describe('Tournament mode: "normal" (all simulated) or "arcade" (user controls one team).'),
    scoringRules: ScoringRulesSchema.describe('Configuration for how match scores are determined.'),
    format: z
      .enum(['league', 'knockout'])
      .describe('Tournament format: "league" or "knockout".'),
    leagueDetails: LeagueDetailsSchema.optional().describe(
      'Details specific to league tournaments, required if format is "league".'
    ),
    hasPlayoffRound: z
      .boolean()
      .describe('Whether the tournament includes a playoff round after the main stage (e.g., after a league phase).'),
    allowAdjustmentsAfterCreation: z
      .boolean()
      .describe('Whether tournament settings can be modified after creation.'),
    initialTeamEconomics: InitialTeamEconomicsSchema.describe(
      'Initial economic settings and variability for teams in the tournament.'
    ),
  })
  .describe('Pre-configured settings for a tournament based on natural language description.');
export type AITournamentSetupOutput = z.infer<
  typeof AITournamentSetupOutputSchema
>;

export async function aiPoweredTournamentSetup(
  input: AITournamentSetupInput
): Promise<AITournamentSetupOutput> {
  return aiPoweredTournamentSetupFlow(input);
}

const aiTournamentSetupPrompt = ai.definePrompt({
  name: 'aiTournamentSetupPrompt',
  input: {schema: AITournamentSetupInputSchema},
  output: {schema: AITournamentSetupOutputSchema},
  prompt: `You are an expert tournament organizer AI. Your task is to interpret a natural language description of a tournament and pre-configure its settings into a structured JSON format.

Carefully read the user's description and extract all relevant information to populate the output fields. If a specific detail is not provided, infer a reasonable and common default value based on the context of the tournament and sport, or common tournament practices.

Here is the tournament description:
{{{tournamentDescription}}}

Please provide the pre-configured tournament settings as a JSON object, adhering strictly to the provided output schema, including reasonable defaults for any unspecified fields.`,
});

const aiPoweredTournamentSetupFlow = ai.defineFlow(
  {
    name: 'aiPoweredTournamentSetupFlow',
    inputSchema: AITournamentSetupInputSchema,
    outputSchema: AITournamentSetupOutputSchema,
  },
  async (input) => {
    const {output} = await aiTournamentSetupPrompt(input);
    return output!;
  }
);
