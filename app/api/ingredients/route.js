import { NextResponse } from "next/server";
import {
  ingredientsTable,
} from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { db } from "@db/";

export async function GET(request){
    const { searchParams } = new URL(request.url);

    const name = searchParams.get("name")?.trim();
    const category = searchParams.get("category")?.trim()

    // Validation
    if (name === "") {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    if (category === "") {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    try {
        const filters = [];
        if(name){
            filters.push(ilike(ingredientsTable.name, `${name}%`));
        } 

        if(category){ 
            filters.push(eq(ingredientsTable.category, category));
        }
        
        const ingredients = await db
            .select()
            .from(ingredientsTable)
            .where(filters.length ? and(...filters) : undefined);
        
        return NextResponse.json(ingredients);
    } catch (error){
        return NextResponse.json({ error: "Failed to fetch ingredient" }, { status: 500 })
    }
}