ALTER TABLE "ingredient_aliases" DROP CONSTRAINT "ingredient_aliases_normalized_alias_unique";--> statement-breakpoint
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "ingredient_aliases_normalized_alias_unique" ON "ingredient_aliases" USING btree ("normalized_alias");--> statement-breakpoint
CREATE UNIQUE INDEX "ingredients_name_unique" ON "ingredients" USING btree ("name");