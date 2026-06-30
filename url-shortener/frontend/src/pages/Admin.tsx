import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLinks, updateLink, deleteLink } from '../api';
import { Link as RouterLink, useNavigate, Navigate } from 'react-router-dom';
import { LogOut, Trash2, BarChart2, Check, X } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['links'],
    queryFn: getLinks,
    retry: false,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: number }) => updateLink(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isError) {
    if ((error as any).message?.includes('Unauthorized') || (error as any).message?.includes('Invalid token')) {
       return <Navigate to="/login" replace />;
    }
    return <div className="p-8 text-center text-red-500">Error loading links: {error.message}</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="space-x-4">
           <RouterLink to="/" className="text-sm hover:underline">Go to Home</RouterLink>
           <button onClick={handleLogout} className="flex items-center text-sm px-3 py-1.5 bg-[var(--border)] rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
             <LogOut size={16} className="mr-2" /> Logout
           </button>
        </div>
      </div>

      <div className="bg-[var(--bg)] rounded-lg border border-[var(--border)] shadow-[var(--shadow)] overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">Loading links...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--code-bg)]">
                <th className="p-4 font-semibold">Short Code</th>
                <th className="p-4 font-semibold">Original URL</th>
                <th className="p-4 font-semibold text-center">Clicks</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.links.length === 0 && (
                 <tr><td colSpan={5} className="p-8 text-center text-gray-500">No links created yet.</td></tr>
              )}
              {data?.links.map((link) => (
                <tr key={link.id} className="border-b border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="p-4 font-mono">
                    <a href={`/${link.short_code}`} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
                      {link.short_code}
                    </a>
                  </td>
                  <td className="p-4 max-w-xs truncate" title={link.original_url}>
                    {link.original_url}
                  </td>
                  <td className="p-4 text-center font-mono">{link.clicks}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleMutation.mutate({ id: link.id, active: link.active ? 0 : 1 })}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        link.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {link.active ? <Check size={14} className="mr-1"/> : <X size={14} className="mr-1"/>}
                      {link.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-4 flex justify-center space-x-2">
                    <RouterLink
                      to={`/admin/analytics/${link.id}`}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors dark:text-blue-400 dark:hover:bg-blue-900"
                      title="View Analytics"
                    >
                      <BarChart2 size={18} />
                    </RouterLink>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this link?')) {
                          deleteMutation.mutate(link.id);
                        }
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors dark:text-red-400 dark:hover:bg-red-900"
                      title="Delete Link"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
