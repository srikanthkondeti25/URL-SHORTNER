import { useParams, Link as RouterLink, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#aa3bff', '#c084fc'];

export default function Analytics() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => getAnalytics(Number(id)),
    retry: false,
    enabled: !!id,
  });

  if (isError) {
    if ((error as any).message?.includes('Unauthorized') || (error as any).message?.includes('Invalid token')) {
       return <Navigate to="/login" replace />;
    }
    return <div className="p-8 text-center text-red-500">Error loading analytics: {error.message}</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  if (!data) return null;

  const { link, analytics } = data;

  // Aggregate Data
  const deviceCounts = analytics.reduce((acc, curr) => {
    const dev = curr.device || 'Unknown';
    acc[dev] = (acc[dev] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceData = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

  const countryCounts = analytics.reduce((acc, curr) => {
    const country = curr.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryData = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, clicks]) => ({ name, clicks }));

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <RouterLink to="/admin" className="text-sm hover:underline text-[var(--accent)]">&larr; Back to Dashboard</RouterLink>
      </div>

      <div className="bg-[var(--bg)] p-6 rounded-lg border border-[var(--border)] shadow-[var(--shadow)] mb-8">
        <h1 className="text-2xl font-bold mb-2">Analytics for /{link.short_code}</h1>
        <p className="text-[var(--text)] mb-4">Original URL: <a href={link.original_url} target="_blank" rel="noreferrer" className="hover:underline">{link.original_url}</a></p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-[var(--code-bg)] p-4 rounded text-center">
             <div className="text-sm text-[var(--text)]">Total Clicks</div>
             <div className="text-3xl font-bold text-[var(--text-h)]">{link.clicks}</div>
           </div>
           <div className="bg-[var(--code-bg)] p-4 rounded text-center">
             <div className="text-sm text-[var(--text)]">Status</div>
             <div className="text-xl font-bold text-[var(--text-h)] mt-2">
                {link.active ? <span className="text-green-500">Active</span> : <span className="text-red-500">Disabled</span>}
             </div>
           </div>
           <div className="bg-[var(--code-bg)] p-4 rounded text-center">
             <div className="text-sm text-[var(--text)]">Created At</div>
             <div className="text-sm font-medium text-[var(--text-h)] mt-2">
                {new Date(link.created_at).toLocaleDateString()}
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Device Distribution */}
        <div className="bg-[var(--bg)] p-6 rounded-lg border border-[var(--border)] shadow-[var(--shadow)]">
          <h2 className="text-xl font-semibold mb-4">Device Distribution</h2>
          {deviceData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-[var(--bg)] p-6 rounded-lg border border-[var(--border)] shadow-[var(--shadow)]">
          <h2 className="text-xl font-semibold mb-4">Top Countries (Top 5)</h2>
          {countryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>
      </div>

      {/* Recent Clicks Table */}
      <div className="mt-8 bg-[var(--bg)] p-6 rounded-lg border border-[var(--border)] shadow-[var(--shadow)] overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Recent Clicks</h2>
        <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="p-2 font-semibold">Time</th>
                <th className="p-2 font-semibold">Device</th>
                <th className="p-2 font-semibold">Browser</th>
                <th className="p-2 font-semibold">Country</th>
              </tr>
            </thead>
            <tbody>
              {analytics.slice(0, 10).map((record) => (
                 <tr key={record.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="p-2 text-sm">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="p-2 text-sm">{record.device || 'N/A'}</td>
                    <td className="p-2 text-sm">{record.browser || 'N/A'}</td>
                    <td className="p-2 text-sm">{record.country || 'N/A'}</td>
                 </tr>
              ))}
              {analytics.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No clicks recorded yet.</td></tr>
              )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
