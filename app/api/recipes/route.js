import { NextResponse } from "next/server";
import { db } from "@db/";
import {
  recipesTable,
  recipeTagsTable,
  tagsTable,
  recipeIngredientsTable,
  ingredientsTable,
  ingredientDetailsTable,
} from "@/db/schema";

import { eq, and } from "drizzle-orm";

export async function GET(request) {
    const { searchParams } = new URL(request.url);

    // Normalize query params
    const tag = searchParams.get("tag")?.trim();
    const sourceType = searchParams.get("sourceType")?.trim();
    const protein = searchParams.get("protein")?.trim();

    const maxCaloriesRaw = searchParams.get("maxCalories");
    const limitRaw = searchParams.get("limit");
    const offsetRaw = searchParams.get("offset");

    // Convert numbers
    const maxCalories = maxCaloriesRaw !== null ? Number(maxCaloriesRaw) : null;
    const limit = limitRaw !== null ? Number(limitRaw) : 20;
    const offset = offsetRaw !== null ? Number(offsetRaw) : 0;

    // Validation 
    if (!isNaN(maxCalories) || maxCalories < 0) {
        return NextResponse.json({ error: "Invalid calorie limit" }, { status: 400 });
    }

    if (isNaN(limit) || limit < 0) {
        return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
    }

    if (isNaN(offset) || offset < 0) {
        return NextResponse.json({ error: "Invalid offset" }, { status: 400 });
    }

    try {
        // Base query (recipes only)
        let query = db
        .select({
            recipe: recipesTable,
        })
        .from(recipesTable);

        // Tag filter
        if (tag) {
        query = query
            .innerJoin(
            recipeTagsTable,
            eq(recipesTable.id, recipeTagsTable.recipeId)
            )
            .innerJoin(
            tagsTable,
            eq(recipeTagsTable.tagId, tagsTable.id)
            )
            .where(eq(tagsTable.name, tag));
        }

        if (sourceType) {
        query = query.where(eq(recipesTable.sourceType, sourceType));
        }

        // Protein filter
        if (protein) {
        query = query
            .innerJoin(
            recipeIngredientsTable,
            eq(recipesTable.id, recipeIngredientsTable.recipeId)
            )
            .innerJoin(
            ingredientsTable,
            eq(recipeIngredientsTable.ingredientId, ingredientsTable.id)
            )
            .where(
            and(
                eq(ingredientsTable.category, "protein"),
                eq(ingredientsTable.name, protein)
            )
            );
        }

        const rows = await query.limit(limit).offset(offset);

        // Group recipes
        const recipeMap = new Map();

        for (const row of rows) {
        const recipe = row.recipe;

        if (!recipeMap.has(recipe.id)) {
            recipeMap.set(recipe.id, {
            ...recipe,
            ingredients: [],
            calories: 0,
            });
        }
        }

        const recipeIds = Array.from(recipeMap.keys());

        // Fetch ingredient details
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
        .where(
            recipeIds.length
            ? sql`${recipeIngredientsTable.recipeId} IN ${recipeIds}`
            : undefined
        );

        // Compute calories
        for (const row of ingredientRows) {
        const recipeId = row.recipe_ingredients.recipeId;
        const ing = row.ingredients;
        const details = row.ingredient_details;

        const weight = row.recipe_ingredients.weight ?? 1;

        const recipe = recipeMap.get(recipeId);
        if (!recipe) continue;

        recipe.ingredients.push({
            id: ing.id,
            name: ing.name,
            category: ing.category,
            weight,
            isOptional: row.recipe_ingredients.isOptional,
        });

        if (details) {
            recipe.calories +=
            (details.caloriesPer100g ?? 0) * weight;
        }
        }

        // Apply calorie filter
        let results = Array.from(recipeMap.values());

        if (maxCalories) {
        results = results.filter(
            (r) => r.calories <= maxCalories
        );
        }

        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json(
        { error: "Failed to fetch recipes" },
        { status: 500 }
        );
    }
}