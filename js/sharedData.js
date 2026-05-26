// sharedData.js
import { ingredientMapping } from './mappings.js';

export const recipeIngredientsMap = new Map();
export const ingredientCompoundsMap = new Map();

export async function loadSharedData() {
    try {
        const recipeIngredients = await d3.csv("data/04_Recipe-Ingredients_Aliases.csv");
        
        recipeIngredients.forEach(row => {
            const recipeId = row["Recipe ID"];
            let originalName = row["Aliased Ingredient Name"].trim().toLowerCase();
            let mappedName = ingredientMapping[originalName] || originalName;
            const ingredientName = mappedName.replace(/_/g, ' ');

            if (!recipeIngredientsMap.has(recipeId)) {
                recipeIngredientsMap.set(recipeId, []);
            }
            recipeIngredientsMap.get(recipeId).push({
                name: row["Aliased Ingredient Name"].trim(),
                id: ingredientName
            });
        });

        const ingrInfo = await d3.tsv("data/ingr_info.tsv");
        const ingrComp = await d3.tsv("data/ingr_comp.tsv");
        const compInfo = await d3.tsv("data/comp_info.tsv");
        
        const compIdToName = new Map(compInfo.map(d => [d["# id"], d["Compound name"].replace(/_/g, ' ')]));
        const tsvIdToName = new Map(ingrInfo.map(d => [d["# id"], d["ingredient name"].replace(/_/g, ' ').trim().toLowerCase()]));

        ingrComp.forEach(row => {
            const tsvIngrId = row["# ingredient id"];
            const compId = row["compound id"];
            
            const ingrName = tsvIdToName.get(tsvIngrId);
            const compName = compIdToName.get(compId) || compId; 

            if (ingrName) {
                if (!ingredientCompoundsMap.has(ingrName)) {
                    ingredientCompoundsMap.set(ingrName, new Set());
                }
                ingredientCompoundsMap.get(ingrName).add(compName);
            }
        });

        console.log("Shared Data pre-processed successfully");

    } catch (error) {
        console.error("Error loading shared data:", error);
    }
}