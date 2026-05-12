import { NextResponse } from "next/server";
import { db } from "@db/";
import {
  recipesTable,
  recipeIngredientsTable,
  ingredientsTable,
} from "@/db/schema";

import { eq } from "drizzle-orm";

export async function POST(request) {
    try {
        const body = await request.json();

        const userIngredients = (body.ingredients || [])
        .map(i => i.trim().toLowerCase())
        .filter(Boolean);

        if (!userIngredients.length) {
        return NextResponse.json(
            { error: "No ingredients provided" },
            { status: 400 }
        );
        }

        const userSet = new Set(userIngredients);

        // Ftech recipes
        const recipes = await db.select().from(recipesTable);

        // Get all ingredients from recipes
        const recipeIngredients = await db
        .select()
        .from(recipeIngredientsTable)
        .innerJoin(
            ingredientsTable,
            eq(recipeIngredientsTable.ingredientId, ingredientsTable.id)
        );

        // Group ingredients by recipe
        const recipeMap = new Map();

        for (const row of recipeIngredients) {
        const recipeId = row.recipe_ingredients.recipeId;
        const ing = row.ingredients;

        if (!recipeMap.has(recipeId)) {
            recipeMap.set(recipeId, []);
        }

        recipeMap.get(recipeId).push({
            name: ing.name.toLowerCase(),
            category: ing.category,
            weight: row.recipe_ingredients.weight ?? 1,
            isOptional: row.recipe_ingredients.isOptional,
        });
        }

        // Scoring 
        function scoreRecipe(ingredients) {
        let matchedWeight = 0;
        let totalWeight = 0;

        let missingRequiredWeight = 0;

        let proteinBonus = 0;
        let baseBonus = 0;

        let matchedCount = 0;

        for (const ing of ingredients) {
            totalWeight += ing.weight;

            const isMatched = userSet.has(ing.name);

            if (isMatched) {
            matchedWeight += ing.weight;
            matchedCount++;

            // category bonuses
            if (ing.category === "protein") {
                proteinBonus += 0.08;
            }

            if (ing.category === "base") {
                baseBonus += 0.05;
            }
            } else {
            // missing ingredient handling
            if (!ing.isOptional) {
                missingRequiredWeight += ing.weight;
            }
            }
        }

        const baseScore = totalWeight
            ? matchedWeight / totalWeight
            : 0;

        // penalty for missing required ingredients
        const missingPenalty = missingRequiredWeight * 0.15;

        const score =
            baseScore +
            proteinBonus +
            baseBonus -
            missingPenalty;

        return {
            score: Math.max(0, Math.min(1, score)),
            matchedCount,
            totalWeight,
        };
        }

        // Create results
        const results = [];

        for (const recipe of recipes) {
        const ingredients = recipeMap.get(recipe.id) || [];

        const { score, matchedCount, totalWeight } =
            scoreRecipe(ingredients);

        // tier classification
        let tier = "weak";

        if (score >= 0.75) tier = "strong";
        else if (score >= 0.45) tier = "medium";

        results.push({
            recipeId: recipe.id,
            title: recipe.title,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            sourceType: recipe.sourceType,

            score,
            tier,
            matchedCount,
            totalIngredients: ingredients.length,
        });
        }

        // Sort
        results.sort((a, b) => b.score - a.score);

        return NextResponse.json(results.slice(0, 20));
    } catch (error) {
        return NextResponse.json(
        { error: "Failed to compute matches" },
        { status: 500 }
        );
    }
}