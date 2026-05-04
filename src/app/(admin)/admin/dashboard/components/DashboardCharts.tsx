'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardChartsProps {
  trendsData: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

/**
 * User Growth Trend Chart
 */
function UserGrowthChart({ data }: { data: any[] }) {
  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs text-muted-foreground" />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#0088FE" name="Users" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Tenant Growth Trend Chart
 */
function TenantGrowthChart({ data }: { data: any[] }) {
  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Growth</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs text-muted-foreground" />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#00C49F" name="Tenants" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Contribution Volume Chart
 */
function ContributionVolumeChart({ data }: { data: any[] }) {
  const hasData = data && data.length > 0;

  const formattedData = hasData ? data.map(item => ({
    ...item,
    value: item.value / 1000000, // Convert to millions
  })) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution Volume</CardTitle>
        <CardDescription>Last 12 months (in millions)</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs text-muted-foreground" />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                formatter={(value: number) => `$${value.toFixed(2)}M`}
              />
              <Legend />
              <Bar dataKey="value" fill="#0088FE" name="Contributions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * API Calls Trend Chart
 */
function ApiCallsChart({ data }: { data: any[] }) {
  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Activity</CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs text-muted-foreground" />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Legend />
              <Bar dataKey="value" fill="#8884D8" name="API Calls" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Plan Type Distribution Chart
 */
function PlanTypeChart({ data }: { data: Record<string, number> }) {
  const hasData = data && Object.keys(data).length > 0;

  const chartData = hasData ? Object.entries(data).map(([name, value]) => ({
    name,
    value,
  })) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Type Distribution</CardTitle>
        <CardDescription>Distribution by plan type</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Top Tenants Chart
 */
function TopTenantsChart({ data }: { data: any[] }) {
  const hasData = data && data.length > 0;

  const chartData = hasData ? data.slice(0, 10).map(tenant => ({
    name: tenant.tenantName || 'Unknown',
    participants: tenant.participantCount || 0,
  })) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Tenants by Participants</CardTitle>
        <CardDescription>Top 10 tenants</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs text-muted-foreground" />
              <YAxis dataKey="name" type="category" className="text-xs text-muted-foreground" width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="participants" fill="#00C49F" name="Participants" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Main Dashboard Charts Component
 */
export default function DashboardCharts({ trendsData }: DashboardChartsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Trends & Analytics</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <UserGrowthChart data={trendsData.userGrowthTrend} />
        <TenantGrowthChart data={trendsData.tenantGrowthTrend} />
        <ContributionVolumeChart data={trendsData.contributionVolumeTrend} />
        <ApiCallsChart data={trendsData.apiCallsTrend} />
        <PlanTypeChart data={trendsData.planTypeDistribution} />
        <TopTenantsChart data={trendsData.topTenantsByParticipants} />
      </div>
    </div>
  );
}
