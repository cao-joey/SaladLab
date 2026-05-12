import { NextResponse } from "next/server";
import {
  ingredientsTable,
  ingredientAliasesTable,
  ingredientDetailsTable,
} from "@/db/schema";

import { eq } from "drizzle-orm";
import { db } from "@db/";

export async function GET(request, { params }) {
    const id = Number(params.id);

    if (isNaN(id) || id <= 0) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    try {
        const rows = await db
        .select()
        .from(ingredientsTable)
        .leftJoin(
            ingredientAliasesTable,
            eq(ingredientsTable.id, ingredientAliasesTable.ingredientId)
        )
        .leftJoin(
            ingredientDetailsTable,
            eq(ingredientsTable.id, ingredientDetailsTable.ingredientId)
        )
        .where(eq(ingredientsTable.id, id));

        if (!rows.length) {
        return NextResponse.json(
            { error: "Ingredient not found" },
            { status: 404 }
        );
        }

        const base = rows[0].ingredients;
        const details = rows[0].ingredient_details;

        const aliases = rows
        .map(r => r.ingredient_aliases?.alias)
        .filter(Boolean);

        return NextResponse.json({
        id: base.id,
        name: base.name,
        category: base.category,
        aliases,

        details: details
            ? {
                caloriesPer100g: details.caloriesPer100g,
                proteinPer100g: details.proteinPer100g,
                carbsPer100g: details.carbsPer100g,
                fatPer100g: details.fatPer100g,
                fiberPer100g: details.fiberPer100g,
                description: details.description,
                benefits: details.benefits,
            }
            : null,
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ingredient" }, { status: 500 });
    }
}