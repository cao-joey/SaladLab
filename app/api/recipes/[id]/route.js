import { NextResponse } from "next/server";
import { db } from "@db/";
import {
  recipesTable,
  recipeIngredientsTable,
  ingredientsTable,
  ingredientDetailsTable,
  recipeTagsTable,
  tagsTable,
} from "@/db/schema";

import { eq } from "drizzle-orm";

export async function GET(request){
    const id = Number(params.id);
    if (!id) {
        return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });
    }

    // Find matching recipe
    const recipeRows = await db.select().from(recipesTable).where(eq(recipesTable.id, id));
    if (!recipeRows.length) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const recipe = recipeRows[0];

    // Get ingredient details from recipe 
    const ingredientRows = await db
    .select()
    .from(recipeIngredientsTable)
    .innerJoin(
        ingredientsTable,
        eq(recipeIngredientsTable.ingredientId, ingredientsTable.id)
    )
    .leftJoin(
        ingredientDetailsTable,
        eq(ingredientsTable.id, ingredientDetailsTable.ingredientId)
    )
    .where(eq(recipeIngredientsTable.recipeId, id));

    // Create ingredient array
    const ingredients = [];
    let nutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    };

    for (const row of ingredientRows) {
        const ing = row.ingredients;
        const details = row.ingredient_details;

        const weight = row.recipe_ingredients.weight ?? 1;

        ingredients.push({
            id: ing.id,
            name: ing.name,
            category: ing.category,
            weight,
            isOptional: row.recipe_ingredients.isOptional,
        });

        if (details) {
            nutrition.calories += (details.caloriesPer100g ?? 0) * weight;
            nutrition.protein += (details.proteinPer100g ?? 0) * weight;
            nutrition.carbs += (details.carbsPer100g ?? 0) * weight;
            nutrition.fat += (details.fatPer100g ?? 0) * weight;
            nutrition.fiber += (details.fiberPer100g ?? 0) * weight;
        }
    }

    // Get tags
    const tagRows = await db
    .select()
    .from(recipeTagsTable)
    .innerJoin(
        tagsTable,
        eq(recipeTagsTable.tagId, tagsTable.id)
    )
    .where(eq(recipeTagsTable.recipeId, id));

    const tags = tagRows.map((t) => t.tags.name);

    return NextResponse.json({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        imageUrl: recipe.imageUrl,
        servings: recipe.servings,
        sourceType: recipe.sourceType,
        createdAt: recipe.createdAt,

        tags,
        ingredients,
        nutrition,
    });
}