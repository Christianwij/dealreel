'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBriefings } from '@/hooks/useBriefings';
import { useRatings } from '@/hooks/useRatings';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function DealAnalytics() {
  const { briefings } = useBriefings();
  const { ratings } = useRatings();

  const dealsByStatus = useMemo(() => {
    if (!briefings) return [];
    
    const statusCounts = briefings.reduce((acc, briefing) => {
      const status = briefing.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [briefings]);

  const ratingDistribution = useMemo(() => {
    if (!ratings) return [];

    const ratingCounts = ratings.reduce((acc, rating) => {
      const score = Math.floor(rating.score);
      acc[score] = (acc[score] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 5 }, (_, i) => ({
      rating: i + 1,
      count: ratingCounts[i + 1] || 0,
    }));
  }, [ratings]);

  const averageRatingByMonth = useMemo(() => {
    if (!ratings) return [];

    const monthlyRatings = ratings.reduce((acc, rating) => {
      const date = new Date(rating.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { sum: 0, count: 0 };
      }
      
      acc[monthKey].sum += rating.score;
      acc[monthKey].count += 1;
      
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    return Object.entries(monthlyRatings)
      .map(([month, { sum, count }]) => ({
        month,
        average: Math.round((sum / count) * 10) / 10,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }, [ratings]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Deal Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dealsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {dealsByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Number of Ratings" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Average Rating Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={averageRatingByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `${month}/${year.slice(2)}`;
                  }}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip
                  labelFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `${month}/${year}`;
                  }}
                />
                <Legend />
                <Bar dataKey="average" name="Average Rating" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 