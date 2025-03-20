import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Utensils,
  Droplet,
  Flame,
  Beef,
  GanttChart,
  MoreVertical,
  Filter
} from 'lucide-react';

export default function MealPlanPage() {
  return (
    <div className="container px-4 py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Meal Planning</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button variant="outline" className="gap-2">
            <GanttChart className="h-4 w-4" />
            <span>Meal Library</span>
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Meal</span>
          </Button>
        </div>
      </div>
      
      {/* Weekly Calendar Navigator */}
      <div className="flex items-center justify-between pb-4 border-b">
        <Button variant="ghost" size="sm" className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Week</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium">June 24 - June 30, 2023</h2>
        </div>
        
        <Button variant="ghost" size="sm" className="gap-1">
          <span>Next Week</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Nutrition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Daily Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">2,340</span>
              <span className="text-muted-foreground text-sm ml-2">/ 2,500 kcal</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[94%]"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Beef className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">156g</span>
                  <span className="text-muted-foreground text-sm ml-2">/ 180g</span>
                </div>
                <span className="text-sm text-muted-foreground">87% of daily goal</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Carbs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Flame className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">230g</span>
                  <span className="text-muted-foreground text-sm ml-2">/ 250g</span>
                </div>
                <span className="text-sm text-muted-foreground">92% of daily goal</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Fats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-violet-100 rounded-full flex items-center justify-center">
                <Droplet className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">78g</span>
                  <span className="text-muted-foreground text-sm ml-2">/ 85g</span>
                </div>
                <span className="text-sm text-muted-foreground">92% of daily goal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="monday" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-7 mb-8">
          <TabsTrigger value="monday">Mon</TabsTrigger>
          <TabsTrigger value="tuesday">Tue</TabsTrigger>
          <TabsTrigger value="wednesday">Wed</TabsTrigger>
          <TabsTrigger value="thursday">Thu</TabsTrigger>
          <TabsTrigger value="friday">Fri</TabsTrigger>
          <TabsTrigger value="saturday">Sat</TabsTrigger>
          <TabsTrigger value="sunday">Sun</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monday" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Monday, June 24</h2>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">2,340</span> / 2,500 calories
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Food
              </Button>
            </div>
          </div>
          
          {/* Breakfast */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Utensils className="h-4 w-4 text-amber-600" />
                  </div>
                  <CardTitle>Breakfast</CardTitle>
                </div>
                <div className="text-sm text-muted-foreground">540 calories</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">Greek Yogurt with Berries and Honey</div>
                      <div className="text-sm font-medium">350 kcal</div>
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                      <div>200g yogurt</div>
                      <div>100g mixed berries</div>
                      <div>1 tbsp honey</div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        <span>P:</span>
                        <span className="font-medium">24g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                        <span>C:</span>
                        <span className="font-medium">45g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full text-xs">
                        <span>F:</span>
                        <span className="font-medium">8g</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">Coffee with Almond Milk</div>
                      <div className="text-sm font-medium">35 kcal</div>
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                      <div>240ml coffee</div>
                      <div>60ml almond milk</div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        <span>P:</span>
                        <span className="font-medium">1g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                        <span>C:</span>
                        <span className="font-medium">2g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full text-xs">
                        <span>F:</span>
                        <span className="font-medium">2.5g</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="border-t pt-4 flex justify-between text-sm">
                  <div>Total</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span>Protein:</span>
                      <span className="font-medium">25g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Carbs:</span>
                      <span className="font-medium">47g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Fats:</span>
                      <span className="font-medium">10.5g</span>
                    </div>
                    <div className="font-medium">385 kcal</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Lunch */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Utensils className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle>Lunch</CardTitle>
                </div>
                <div className="text-sm text-muted-foreground">720 calories</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">Grilled Chicken Salad with Avocado</div>
                      <div className="text-sm font-medium">720 kcal</div>
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                      <div>200g chicken breast</div>
                      <div>1/2 avocado</div>
                      <div>Mixed greens</div>
                      <div>Cherry tomatoes</div>
                      <div>2 tbsp olive oil dressing</div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        <span>P:</span>
                        <span className="font-medium">52g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                        <span>C:</span>
                        <span className="font-medium">15g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full text-xs">
                        <span>F:</span>
                        <span className="font-medium">48g</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="border-t pt-4 flex justify-between text-sm">
                  <div>Total</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span>Protein:</span>
                      <span className="font-medium">52g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Carbs:</span>
                      <span className="font-medium">15g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Fats:</span>
                      <span className="font-medium">48g</span>
                    </div>
                    <div className="font-medium">720 kcal</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Dinner */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Utensils className="h-4 w-4 text-indigo-600" />
                  </div>
                  <CardTitle>Dinner</CardTitle>
                </div>
                <div className="text-sm text-muted-foreground">850 calories</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">Salmon with Roasted Vegetables and Quinoa</div>
                      <div className="text-sm font-medium">850 kcal</div>
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                      <div>180g salmon fillet</div>
                      <div>150g mixed vegetables</div>
                      <div>100g cooked quinoa</div>
                      <div>1 tbsp olive oil</div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        <span>P:</span>
                        <span className="font-medium">45g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                        <span>C:</span>
                        <span className="font-medium">58g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full text-xs">
                        <span>F:</span>
                        <span className="font-medium">40g</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="border-t pt-4 flex justify-between text-sm">
                  <div>Total</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span>Protein:</span>
                      <span className="font-medium">45g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Carbs:</span>
                      <span className="font-medium">58g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Fats:</span>
                      <span className="font-medium">40g</span>
                    </div>
                    <div className="font-medium">850 kcal</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Snacks */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-rose-100 rounded-full flex items-center justify-center">
                    <Utensils className="h-4 w-4 text-rose-600" />
                  </div>
                  <CardTitle>Snacks</CardTitle>
                </div>
                <div className="text-sm text-muted-foreground">385 calories</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">Protein Shake</div>
                      <div className="text-sm font-medium">250 kcal</div>
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                      <div>1 scoop protein powder</div>
                      <div>240ml almond milk</div>
                      <div>1 banana</div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        <span>P:</span>
                        <span className="font-medium">25g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                        <span>C:</span>
                        <span className="font-medium">30g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full text-xs">
                        <span>F:</span>
                        <span className="font-medium">5g</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">Almonds</div>
                      <div className="text-sm font-medium">135 kcal</div>
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                      <div>25g (small handful)</div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        <span>P:</span>
                        <span className="font-medium">5g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                        <span>C:</span>
                        <span className="font-medium">5g</span>
                      </div>
                      <div className="flex items-center gap-1 bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full text-xs">
                        <span>F:</span>
                        <span className="font-medium">12g</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="border-t pt-4 flex justify-between text-sm">
                  <div>Total</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span>Protein:</span>
                      <span className="font-medium">30g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Carbs:</span>
                      <span className="font-medium">35g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Fats:</span>
                      <span className="font-medium">17g</span>
                    </div>
                    <div className="font-medium">385 kcal</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-primary/10 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Daily Summary</h3>
              <Button variant="outline" size="sm">
                Generate Report
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Calories</h4>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">2,340</span>
                  <span className="text-muted-foreground text-sm ml-2">/ 2,500 kcal</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[94%]"></div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Protein</h4>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">152g</span>
                  <span className="text-muted-foreground text-sm ml-2">/ 180g</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[84%]"></div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Carbohydrates</h4>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">155g</span>
                  <span className="text-muted-foreground text-sm ml-2">/ 250g</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full w-[62%]"></div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Fats</h4>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">115g</span>
                  <span className="text-muted-foreground text-sm ml-2">/ 85g</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full w-[135%]"></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="tuesday" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Tuesday, June 25</h2>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">0</span> / 2,500 calories
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Food
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <div className="flex flex-col items-center text-center max-w-md">
              <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No meals planned yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t added any meals for Tuesday yet. Start planning your meals for a balanced nutrition plan.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Meal
              </Button>
            </div>
          </div>
        </TabsContent>
        
        {/* Other days would have similar content */}
        <TabsContent value="wednesday">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Wednesday, June 26</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Food
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Wednesday&apos;s meal plan content would go here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="thursday">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Thursday, June 27</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Food
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Thursday&apos;s meal plan content would go here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="friday">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Friday, June 28</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Food
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Friday&apos;s meal plan content would go here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="saturday">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Saturday, June 29</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Food
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Saturday&apos;s meal plan content would go here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="sunday">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Sunday, June 30</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Food
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Sunday&apos;s meal plan content would go here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 