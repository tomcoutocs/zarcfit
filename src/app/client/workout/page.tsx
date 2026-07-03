import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CalendarDays, 
  BarChart3, 
  ListChecks, 
  Clock, 
  TrendingUp, 
  Trophy, 
  Dumbbell, 
  Plus,
  MoreVertical
} from 'lucide-react';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';

export default function WorkoutPage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader title="Workout Tracking" description="Track exercises, sets, and progress">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Calendar</span>
          </Button>
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
          <Button className="gap-2 glow-primary">
            <Plus className="h-4 w-4" />
            <span>New Workout</span>
          </Button>
        </div>
      </DashboardPageHeader>
      
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 mb-8">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-6">
          {/* Today's Workout */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Monday, June 24</div>
                  <CardTitle className="text-2xl">Push Day - Upper Body</CardTitle>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Exercises</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>60-75 min</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Completed Exercise */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-start gap-3">
                        <Checkbox id="ex1" checked />
                        <div className="flex-1">
                          <label htmlFor="ex1" className="text-base font-medium line-through cursor-pointer">
                            Bench Press
                          </label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <div className="text-xs bg-muted px-2 py-1 rounded line-through">Set 1: 135lb × 12</div>
                            <div className="text-xs bg-muted px-2 py-1 rounded line-through">Set 2: 155lb × 10</div>
                            <div className="text-xs bg-muted px-2 py-1 rounded line-through">Set 3: 175lb × 8</div>
                            <div className="text-xs bg-muted px-2 py-1 rounded line-through">Set 4: 185lb × 6</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Current Exercise */}
                    <div className="border border-primary rounded-lg p-4 bg-primary/5">
                      <div className="flex items-start gap-3">
                        <Checkbox id="ex2" />
                        <div className="flex-1">
                          <label htmlFor="ex2" className="text-base font-medium cursor-pointer">
                            Incline Dumbbell Press
                          </label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <div className="text-xs bg-muted px-2 py-1 rounded">Set 1: 50lb × 12</div>
                            <div className="text-xs bg-muted px-2 py-1 rounded">Set 2: 55lb × 10</div>
                            <div className="text-xs bg-muted px-2 py-1 rounded">Set 3: 60lb × 8</div>
                            <div className="text-xs bg-primary/20 px-2 py-1 rounded font-medium">Set 4: 65lb × ?</div>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1">
                              <Input type="number" placeholder="Weight (lbs)" className="text-right" />
                            </div>
                            <span>×</span>
                            <div className="flex-1">
                              <Input type="number" placeholder="Reps" />
                            </div>
                            <Button size="sm">Log</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Upcoming Exercises */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox id="ex3" />
                        <div className="flex-1">
                          <label htmlFor="ex3" className="text-base font-medium cursor-pointer">
                            Chest Flyes
                          </label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <div className="text-xs bg-muted px-2 py-1 rounded">4 sets × 12 reps</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox id="ex4" />
                        <div className="flex-1">
                          <label htmlFor="ex4" className="text-base font-medium cursor-pointer">
                            Shoulder Press
                          </label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <div className="text-xs bg-muted px-2 py-1 rounded">4 sets × 10-12 reps</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox id="ex5" />
                        <div className="flex-1">
                          <label htmlFor="ex5" className="text-base font-medium cursor-pointer">
                            Tricep Pushdowns
                          </label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <div className="text-xs bg-muted px-2 py-1 rounded">3 sets × 15 reps</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox id="ex6" />
                        <div className="flex-1">
                          <label htmlFor="ex6" className="text-base font-medium cursor-pointer">
                            Overhead Tricep Extensions
                          </label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <div className="text-xs bg-muted px-2 py-1 rounded">3 sets × 12 reps</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-80 space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Workout Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Completion</span>
                            <span className="font-medium">17%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full w-[17%]"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex-1 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>Completed</span>
                          </div>
                          <span className="font-medium">1/6</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex-1 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span>In Progress</span>
                          </div>
                          <span className="font-medium">1/6</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex-1 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-muted"></div>
                            <span>Remaining</span>
                          </div>
                          <span className="font-medium">4/6</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Workout Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea 
                        className="w-full min-h-[120px] text-sm p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Add notes about your workout..."
                      ></textarea>
                      <Button size="sm" className="mt-2 w-full">Save Notes</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button variant="outline">Previous Workout</Button>
                <Button>Complete Workout</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Upcoming Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Pull Day - Back & Biceps</h3>
                      <p className="text-sm text-muted-foreground">Tuesday, June 25 • 8 Exercises</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Leg Day</h3>
                      <p className="text-sm text-muted-foreground">Thursday, June 27 • 7 Exercises</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Push Day - Upper Body</h3>
                      <p className="text-sm text-muted-foreground">Monday, July 1 • 6 Exercises</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Workout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ListChecks className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Pull Day - Back & Biceps</h3>
                      <p className="text-sm text-muted-foreground">Friday, June 21 • Completed</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ListChecks className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Leg Day</h3>
                      <p className="text-sm text-muted-foreground">Wednesday, June 19 • Completed</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ListChecks className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Push Day - Upper Body</h3>
                      <p className="text-sm text-muted-foreground">Monday, June 17 • Completed</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ListChecks className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Pull Day - Back & Biceps</h3>
                      <p className="text-sm text-muted-foreground">Friday, June 14 • Completed</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button variant="outline">Load More</Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Progress Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Track your performance over time</p>
                <Button variant="outline" className="w-full">View Progress</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span>Personal Records</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">See your best lifts and achievements</p>
                <Button variant="outline" className="w-full">View PRs</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Analyze your workout data and trends</p>
                <Button variant="outline" className="w-full">View Analytics</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 