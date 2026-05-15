import { 
    integer, 
    pgEnum, 
    pgTable, 
    varchar, 
    primaryKey, 
    timestamp,
    boolean,
    real,
    text,
    uniqueIndex
} from "drizzle-orm/pg-core";

export const ingredientCategoryEnum = pgEnum("ingredients_category", [
    "base", "vegetable", "protein", "cheese", "crunch", 
    "fruit", "grain", "dressing", "seasoning", "legume", "acid"
]);

export const recipeSourceTypeEnum = pgEnum("recipe_source_type", [
    "seeded", "user_added"
]);

export const ingredientsTable = pgTable("ingredients", { 
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name").notNull(),
    category: ingredientCategoryEnum().notNull(),
}, table => ({
        nameUnique: uniqueIndex("ingredients_name_unique").on(table.name),
}));


export const ingredientAliasesTable = pgTable("ingredient_aliases", {
    ingredientId: integer("ingredient_id")
    .notNull()
    .references(() => ingredientsTable.id, { onDelete: "cascade" }),

    alias: varchar("alias").notNull(),

    normalizedAlias: varchar("normalized_alias")
    .notNull()
    .primaryKey(),
}, table => ({
    normalizedAliasUnique: uniqueIndex(
    "ingredient_aliases_normalized_alias_unique"
    ).on(table.normalizedAlias),
}));


export const ingredientDetailsTable = pgTable("ingredient_details", {
    ingredientId: integer("ingredient_id").primaryKey().references(() => 
        ingredientsTable.id, {onDelete: 'cascade'}
    ),
    caloriesPer100g: real("calories_per_100g").notNull(),
    proteinPer100g: real("protein_per_100g").notNull(),
    carbsPer100g: real("carbs_per_100g").notNull(),
    fatPer100g: real("fat_per_100g").notNull(),
    fiberPer100g: real("fiber_per_100g").notNull(),
    description: text().notNull(),
    benefits: text(),
});

export const recipesTable = pgTable("recipes", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: text().notNull(),
    description: text(),
    instructions: text().notNull(),
    imageUrl: text("image_url"),
    servings: real(),
    sourceType: recipeSourceTypeEnum().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    prep_time: integer().notNull(),
    cook_time: integer().notNull(),
    total_time: integer().notNull(),
});

export const recipeIngredientsTable = pgTable("recipe_ingredients", {
    recipeId: integer("recipe_id").notNull().references(() => 
        recipesTable.id, {onDelete: 'cascade'}
    ),
    ingredientId: integer("ingredient_id").notNull().references(() => ingredientsTable.id),
    quantity: real(),
    unit: varchar("unit"),
    isOptional: boolean("is_optional").notNull().default(false),
    weight: real().notNull().default(1),
}, table => [
    primaryKey({ columns: [table.recipeId, table.ingredientId] }),
]);

export const tagsTable = pgTable("tags", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar().notNull().unique(),
});

export const recipeTagsTable = pgTable("recipe_tags", {
    tagId: integer("tag_id").notNull().references(() => 
        tagsTable.id, {onDelete: 'cascade'}
    ),
    recipeId: integer("recipe_id").notNull().references(() => 
        recipesTable.id, {onDelete: 'cascade'}
    ),
}, table => [
    primaryKey({ columns: [table.recipeId, table.tagId ]}),
]);