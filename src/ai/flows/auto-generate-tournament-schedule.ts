'use server';
/**
 * @fileOverview A Genkit flow for automatically generating a tournament schedule.
 *
 * - autoGenerateTournamentSchedule - A function that handles the tournament schedule generation process.
 * - AutoGenerateTournamentScheduleInput - The input type for the autoGenerateTournamentSchedule function.
 * - AutoGenerateTournamentScheduleOutput - The return type for the autoGenerateTournamentSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TeamSchema = z.object({
  id: z.string().describe('Unique identifier for the team.'),
  name: z.string().describe('The name of the team.'),
  abbreviation: z.string().length(3).describe('Three-letter abbreviation for the team.'),
  rating: z.number().int().min(1).max(100).describe('Team rating from 1 to 100.'),
});

const MatchSchema = z.object({
  homeTeamId: z.string().describe('The ID of the home team.'),
  awayTeamId: z.string().describe('The ID of the away team.'),
});

const MatchdaySchema = z.object({
  matchdayNumber: z.number().int().min(1).describe('The number of the matchday.'),
  matches: z.array(MatchSchema).describe('List of matches for this matchday.'),
});

const AutoGenerateTournamentScheduleInputSchema = z.object({
  tournamentName: z.string().describe('The name of the tournament.'),
  tournamentType: z.enum(['league', 'knockout']).describe('The type of tournament: league or knockout.'),
  teams: z.array(TeamSchema).min(2).describe('A list of participating teams, each with an ID, name, abbreviation, and rating.'),
  sport: z.string().describe('The sport played in the tournament (e.g., "Football", "Basketball").'),
  numMatchdays: z.number().int().min(1).optional().describe('Optional: For league tournaments, the desired number of matchdays. If not provided, a full round-robin is assumed.'),
});
export type AutoGenerateTournamentScheduleInput = z.infer<typeof AutoGenerateTournamentScheduleInputSchema>;

const AutoGenerateTournamentScheduleOutputSchema = z.object({
  schedule: z.array(MatchdaySchema).describe('The generated tournament schedule, organized by matchdays.'),
  summary: z.string().describe('A summary of the generated schedule, e.g., "Generated a 5-matchday league schedule for 4 teams."'),
});
export type AutoGenerateTournamentScheduleOutput = z.infer<typeof AutoGenerateTournamentScheduleOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateTournamentSchedulePrompt',
  input: {schema: AutoGenerateTournamentScheduleInputSchema},
  output: {schema: AutoGenerateTournamentScheduleOutputSchema},
  prompt: `You are an expert tournament organizer. Your task is to generate a fair and balanced match schedule for a tournament. The schedule should ensure that each team plays only once per matchday.

Tournament Details:
- Name: {{{tournamentName}}}
- Type: {{{tournamentType}}}
- Sport: {{{sport}}}
- Teams: {{#each teams}}{{{id}}} ({{{name}}}, rating: {{{rating}}}) {{/each}}
{{#if numMatchdays}}- Desired Number of Matchdays: {{{numMatchdays}}}{{/if}}

Instructions:
{{#if (eq tournamentType "league")}}
  For a 'league' tournament, generate a round-robin schedule where every team eventually plays every other team, or as many unique matchups as possible within the specified numMatchdays. Each team should play exactly one match per matchday. List all matches for each matchday.
{{else if (eq tournamentType "knockout")}}
  For a 'knockout' tournament, generate a single-elimination bracket. The number of teams must be a power of 2 for a perfectly balanced bracket. If not, some teams might have a 'bye' in the first round. List the matches for each round (matchday) until a winner can be determined.
{{/if}}

Ensure the output strictly adheres to the JSON schema for AutoGenerateTournamentScheduleOutput.`,
});

const autoGenerateTournamentScheduleFlow = ai.defineFlow(
  {
    name: 'autoGenerateTournamentScheduleFlow',
    inputSchema: AutoGenerateTournamentScheduleInputSchema,
    outputSchema: AutoGenerateTournamentScheduleOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate tournament schedule.');
    }
    return output;
  }
);

export async function autoGenerateTournamentSchedule(
  input: AutoGenerateTournamentScheduleInput
): Promise<AutoGenerateTournamentScheduleOutput> {
  return autoGenerateTournamentScheduleFlow(input);
}
