import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema'; 
import * as fs from 'fs';

// Replace with your actual database connection details
const connectionString = "postgres://user:password@localhost:5432/dbname";
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
    const rawData = fs.readFileSync('ingredients_data.json', 'utf-8');
    const ingredients = JSON.parse(rawData);

    console.log(`Inserting ${ingredients.length} ingredients...`);

    for (const item of ingredients) {
        try {
            await db.transaction(async (tx) => {
                // Insert into ingredientsTable
                const [insertedIngredient] = await tx.insert(schema.ingredientsTable).values({
                    name: item.name,
                    category: item.category, 
                }).onConflictDoNothing().returning({ id: schema.ingredientsTable.id });

                if (!insertedIngredient) {
                    console.log(`⏭️  Skipping "${item.name}" (Already exists)`);
                    return;
                }

                const ingredientId = insertedIngredient.id;

                // Insert nutrition + desc + benefits
                const nutrition = item.nutrients_per_100g;
                
                await tx.insert(schema.ingredientDetailsTable).values({
                    ingredientId: ingredientId,
                    caloriesPer100g: nutrition.calories,
                    proteinPer100g: nutrition.protein,
                    carbsPer100g: nutrition.carbs,
                    fatPer100g: nutrition.fat,
                    fiberPer100g: nutrition.fiber,
                    description: item.description || `Culinary details for ${item.name}`,
                    benefits: item.benefits && item.benefits.length > 0 
                        ? item.benefits.join('; ') 
                        : null, 
                });

                // Insert aliases
                if (item.aliases && item.aliases.length > 0) {
                    const aliasEntries = item.aliases.map((alias: string) => ({
                        ingredientId: ingredientId,
                        alias: alias,
                        normalizedAlias: alias.toLowerCase().trim(),
                    }));

                    await tx.insert(schema.ingredientAliasesTable)
                        .values(aliasEntries)
                        .onConflictDoNothing();
                }

                console.log(`Successfully inserted: ${item.name}`);
            });
        } catch (error) {
            console.error(`Failed on ${item.name}:`, error);
        }
    }

    console.log("\nDatabase seeding complete.");
    process.exit(0);
}

seed();