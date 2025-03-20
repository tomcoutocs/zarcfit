import React from 'react';
import { SleepRecord } from '@/lib/supabase/dashboard-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Moon, Battery, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface SleepStatsProps {
  sleepRecords: SleepRecord[];
}

const SleepStats: React.FC<SleepStatsProps> = ({ sleepRecords }) => {
  if (sleepRecords.length === 0) {
    return null;
  }

  // Sort records by date (newest first)
  const sortedRecords = [...sleepRecords].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Latest record
  const latestRecord = sortedRecords[0];
  
  // Calculate weekly averages (last 7 days)
  const lastWeekRecords = sortedRecords.slice(0, 7);
  
  // Average sleep duration
  const averageDuration = 
    sleepRecords.reduce((sum, record) => sum + record.sleep_duration_hours, 0) / sleepRecords.length;
  
  // Average sleep quality
  const recordsWithQuality = sleepRecords.filter(record => record.sleep_quality);
  const averageQuality = recordsWithQuality.length
    ? recordsWithQuality.reduce((sum, record) => sum + (record.sleep_quality || 0), 0) / recordsWithQuality.length
    : 0;
  
  // Weekly averages for comparison
  const weeklyAvgDuration = lastWeekRecords.length
    ? lastWeekRecords.reduce((sum, record) => sum + record.sleep_duration_hours, 0) / lastWeekRecords.length
    : 0;

  const recordsWithQualityWeekly = lastWeekRecords.filter(record => record.sleep_quality);
  const weeklyAvgQuality = recordsWithQualityWeekly.length
    ? recordsWithQualityWeekly.reduce((sum, record) => sum + (record.sleep_quality || 0), 0) / recordsWithQualityWeekly.length
    : 0;
  
  // Calculate trends (compared to overall average)
  const durationTrend = weeklyAvgDuration - averageDuration;
  const qualityTrend = weeklyAvgQuality - averageQuality;
  
  // Calculate sleep phase distribution (if available)
  const sleepPhases = {
    deep: sleepRecords.filter(r => r.deep_sleep_hours).length 
      ? sleepRecords.reduce((sum, r) => sum + (r.deep_sleep_hours || 0), 0) / sleepRecords.length 
      : 0,
    light: sleepRecords.filter(r => r.light_sleep_hours).length 
      ? sleepRecords.reduce((sum, r) => sum + (r.light_sleep_hours || 0), 0) / sleepRecords.length 
      : 0,
    rem: sleepRecords.filter(r => r.rem_sleep_hours).length 
      ? sleepRecords.reduce((sum, r) => sum + (r.rem_sleep_hours || 0), 0) / sleepRecords.length 
      : 0
  };
  
  // Find longest sleep streak
  const streaks = calculateStreaks(sleepRecords);
    
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Sleep Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Sleep Overview
          </CardTitle>
          <CardDescription>
            Summary of your sleep patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Average Duration</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{averageDuration.toFixed(1)} hrs</p>
                <div className={`flex items-center ${durationTrend > 0 ? 'text-green-500' : durationTrend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {durationTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : durationTrend < 0 ? (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  ) : null}
                  <span className="text-sm">{Math.abs(durationTrend).toFixed(1)} hrs</span>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Average Quality</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-2xl font-bold mr-2">{averageQuality.toFixed(1)}</p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`text-sm ${Number(averageQuality) >= star ? 'text-primary' : 'text-muted'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`flex items-center ${qualityTrend > 0 ? 'text-green-500' : qualityTrend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {qualityTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : qualityTrend < 0 ? (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  ) : null}
                  <span className="text-sm">{Math.abs(qualityTrend).toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Records Tracked</p>
              <p className="text-2xl font-bold">{sleepRecords.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Card 2: Latest Sleep */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            Latest Sleep
          </CardTitle>
          <CardDescription>
            {new Date(latestRecord.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-bold">{latestRecord.sleep_duration_hours} hrs</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Quality</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold mr-2">{latestRecord.sleep_quality || 'N/A'}</p>
                {latestRecord.sleep_quality && (
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`text-sm ${(latestRecord.sleep_quality || 0) >= star ? 'text-primary' : 'text-muted'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Bed Time</p>
                <p className="font-medium">{latestRecord.time_to_bed || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wake Time</p>
                <p className="font-medium">{latestRecord.time_woke_up || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Card 3: Sleep Composition */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Battery className="h-5 w-5 text-primary" />
            Sleep Insights
          </CardTitle>
          <CardDescription>
            Analysis of your sleep data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="composition">
            <TabsList className="w-full">
              <TabsTrigger value="composition" className="flex-1">Composition</TabsTrigger>
              <TabsTrigger value="streak" className="flex-1">Streak</TabsTrigger>
            </TabsList>
            
            <TabsContent value="composition" className="pt-4">
              {(sleepPhases.deep > 0 || sleepPhases.light > 0 || sleepPhases.rem > 0) ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Deep Sleep</p>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${(sleepPhases.deep / (sleepPhases.deep + sleepPhases.light + sleepPhases.rem)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{sleepPhases.deep.toFixed(1)}h</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Light Sleep</p>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-400 h-2.5 rounded-full" 
                          style={{ width: `${(sleepPhases.light / (sleepPhases.deep + sleepPhases.light + sleepPhases.rem)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{sleepPhases.light.toFixed(1)}h</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">REM Sleep</p>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full" 
                          style={{ width: `${(sleepPhases.rem / (sleepPhases.deep + sleepPhases.light + sleepPhases.rem)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{sleepPhases.rem.toFixed(1)}h</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground pt-2">
                    Average of tracked sleep phases
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-28 text-muted-foreground text-sm">
                  No sleep phase data available
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="streak" className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="h-10 w-10 mx-auto text-primary mb-2" />
                    <p className="text-3xl font-bold">{streaks.current}</p>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-xl font-bold">{streaks.longest}</p>
                    <p className="text-xs text-muted-foreground">Longest Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{streaks.total}</p>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to calculate streaks
function calculateStreaks(sleepRecords: SleepRecord[]) {
  if (sleepRecords.length === 0) {
    return { current: 0, longest: 0, total: 0 };
  }
  
  // Sort by date (newest first)
  const sortedDates = [...sleepRecords]
    .map(record => new Date(record.date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  // Convert to yyyy-mm-dd strings for comparison
  const dateStrings = sortedDates.map(date => date.toISOString().split('T')[0]);
  
  // Calculate current streak
  let currentStreak = 1;
  const today = new Date().toISOString().split('T')[0];
  
  // If latest record is today, count streaks backward
  const startDate = dateStrings[0] === today ? dateStrings[0] : today;
  const startIdx = dateStrings[0] === today ? 0 : -1;
  
  // Go back one day at a time and check if we have a record
  const currentDate = new Date(startDate);
  
  for (let i = startIdx + 1; i < dateStrings.length; i++) {
    currentDate.setDate(currentDate.getDate() - 1);
    const expectedDate = currentDate.toISOString().split('T')[0];
    
    if (dateStrings[i] === expectedDate) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // If latest record is not from today, reset streak to 0
  if (startIdx === -1) {
    currentStreak = 0;
  }
  
  // Calculate longest streak
  let longestStreak = 1;
  let currentLongest = 1;
  
  for (let i = 1; i < dateStrings.length; i++) {
    const prevDate = new Date(dateStrings[i-1]);
    prevDate.setDate(prevDate.getDate() - 1);
    const expectedDate = prevDate.toISOString().split('T')[0];
    
    if (dateStrings[i] === expectedDate) {
      currentLongest++;
      longestStreak = Math.max(longestStreak, currentLongest);
    } else {
      currentLongest = 1;
    }
  }
  
  return {
    current: currentStreak,
    longest: longestStreak,
    total: sleepRecords.length
  };
}

export default SleepStats; 