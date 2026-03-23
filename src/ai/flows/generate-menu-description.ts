'use server';
/**
 * @fileOverview A Genkit flow for generating engaging, marketing-friendly descriptions for menu items.
 *
 * - generateMenuDescription - A function that handles the menu item description generation process.
 * - GenerateMenuDescriptionInput - The input type for the generateMenuDescription function.
 * - GenerateMenuDescriptionOutput - The return type for the generateMenuDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMenuDescriptionInputSchema = z.object({
  name: z.string().describe('The name of the menu item.'),
  category: z.string().describe('The category of the menu item (e.g., Beverages, Bakery, Food, Desserts).'),
});
export type GenerateMenuDescriptionInput = z.infer<typeof GenerateMenuDescriptionInputSchema>;

const GenerateMenuDescriptionOutputSchema = z.object({
  description: z.string().describe('An engaging and marketing-friendly description for the menu item.'),
});
export type GenerateMenuDescriptionOutput = z.infer<typeof GenerateMenuDescriptionOutputSchema>;

export async function generateMenuDescription(input: GenerateMenuDescriptionInput): Promise<GenerateMenuDescriptionOutput> {
  return generateMenuDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMenuDescriptionPrompt',
  input: { schema: GenerateMenuDescriptionInputSchema },
  output: { schema: GenerateMenuDescriptionOutputSchema },
  prompt: `You are a creative copywriter specializing in food and beverage marketing. Your goal is to create short, engaging, and marketing-friendly descriptions for menu items.

Generate a compelling description for a menu item with the following details:

Menu Item Name: {{{name}}}
Category: {{{category}}}

Ensure the description is appealing, highlights key aspects, and entices customers.
`,
});

const generateMenuDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMenuDescriptionFlow',
    inputSchema: GenerateMenuDescriptionInputSchema,
    outputSchema: GenerateMenuDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
