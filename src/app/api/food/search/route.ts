import { NextRequest, NextResponse } from 'next/server';

type FatSecretFood = {
  food_id: string;
  food_name: string;
  food_description?: string;
};

async function getFatSecretToken(): Promise<string | null> {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ foods: [] });
  }

  const token = await getFatSecretToken();
  if (!token) {
    return NextResponse.json(
      { error: 'FatSecret API not configured. Set FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET.' },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    method: 'foods.search',
    search_expression: query,
    format: 'json',
    max_results: '20',
  });

  const res = await fetch(`https://platform.fatsecret.com/rest/server.api?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Food search failed' }, { status: 502 });
  }

  const data = await res.json();
  const rawFoods = data?.foods?.food;
  const list = Array.isArray(rawFoods) ? rawFoods : rawFoods ? [rawFoods] : [];

  const foods: FatSecretFood[] = list.map((f: { food_id: string; food_name: string; food_description?: string }) => ({
    food_id: String(f.food_id),
    food_name: f.food_name,
    food_description: f.food_description,
  }));

  return NextResponse.json({ foods });
}
