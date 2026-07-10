import { NextRequest, NextResponse } from 'next/server';
import type { FoodSearchResult } from '@/lib/nutrition/food-types';

const USDA_NUTRIENT = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
} as const;

function nutrientValue(
  nutrients: { nutrientId?: number; nutrientNumber?: string; value?: number }[] | undefined,
  id: number
): number | undefined {
  if (!nutrients) return undefined;
  const match = nutrients.find(
    (n) => n.nutrientId === id || n.nutrientNumber === String(id)
  );
  return match?.value != null ? Math.round(match.value * 10) / 10 : undefined;
}

async function searchUsda(query: string): Promise<FoodSearchResult[]> {
  const apiKey = process.env.USDA_FDC_API_KEY || 'DEMO_KEY';
  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    pageSize: '15',
    dataType: 'Foundation,SR Legacy,Survey (FNDDS),Branded',
  });

  const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const foods = data?.foods || [];

  return foods.map(
    (food: {
      fdcId: number;
      description: string;
      brandOwner?: string;
      servingSize?: number;
      servingSizeUnit?: string;
      foodNutrients?: { nutrientId?: number; nutrientNumber?: string; value?: number }[];
    }): FoodSearchResult => {
      const serving =
        food.servingSize && food.servingSizeUnit
          ? `${food.servingSize} ${food.servingSizeUnit}`
          : 'per 100g';

      return {
        id: String(food.fdcId),
        name: food.description,
        brand: food.brandOwner,
        serving_description: serving,
        calories: nutrientValue(food.foodNutrients, USDA_NUTRIENT.calories),
        protein_grams: nutrientValue(food.foodNutrients, USDA_NUTRIENT.protein),
        carbs_grams: nutrientValue(food.foodNutrients, USDA_NUTRIENT.carbs),
        fat_grams: nutrientValue(food.foodNutrients, USDA_NUTRIENT.fat),
        source: 'usda',
      };
    }
  );
}

async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '15',
    fields: 'code,product_name,brands,nutriments,serving_size,serving_quantity',
  });

  const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const products = data?.products || [];

  return products
    .filter((p: { product_name?: string }) => p.product_name)
    .map(
      (product: {
        code: string;
        product_name: string;
        brands?: string;
        serving_size?: string;
        nutriments?: Record<string, number>;
      }): FoodSearchResult => {
        const n = product.nutriments || {};
        const calories =
          n['energy-kcal_serving'] ??
          n['energy-kcal_100g'] ??
          (n.energy_100g ? n.energy_100g / 4.184 : undefined);
        const protein = n.proteins_serving ?? n.proteins_100g;
        const carbs = n.carbohydrates_serving ?? n.carbohydrates_100g;
        const fat = n.fat_serving ?? n.fat_100g;

        return {
          id: product.code,
          name: product.product_name,
          brand: product.brands,
          serving_description: product.serving_size || 'per serving',
          calories: calories != null ? Math.round(calories) : undefined,
          protein_grams: protein != null ? Math.round(protein * 10) / 10 : undefined,
          carbs_grams: carbs != null ? Math.round(carbs * 10) / 10 : undefined,
          fat_grams: fat != null ? Math.round(fat * 10) / 10 : undefined,
          source: 'openfoodfacts',
        };
      }
    );
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ foods: [] });
  }

  try {
    let foods = await searchUsda(query);

    if (foods.length === 0) {
      foods = await searchOpenFoodFacts(query);
    }

    return NextResponse.json({ foods });
  } catch {
    return NextResponse.json({ error: 'Food search failed' }, { status: 502 });
  }
}
