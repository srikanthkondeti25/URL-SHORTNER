import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateLinkSchema } from 'shared';
import type { CreateLinkRequest } from 'shared';
import { useMutation } from '@tanstack/react-query';
import { shortenUrl } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateLinkRequest>({
    resolver: zodResolver(CreateLinkSchema)
  });

  const mutation = useMutation({
    mutationFn: shortenUrl,
    onSuccess: (data) => {
      setShortenedUrl(data.shortUrl);
    },
  });

  const onSubmit = (data: CreateLinkRequest) => {
    mutation.mutate(data);
  };

  const copyToClipboard = () => {
    if (shortenedUrl) {
      navigator.clipboard.writeText(shortenedUrl);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
         <Link to="/login" className="text-sm hover:underline">Admin Login</Link>
      </div>
      <div className="max-w-md w-full bg-[var(--bg)] p-8 rounded-lg border border-[var(--border)] shadow-[var(--shadow)]">
        <h1 className="text-3xl font-bold text-center mb-6">URL Shortener</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Original URL</label>
            <input
              type="text"
              placeholder="https://example.com"
              {...register('url')}
              className="w-full px-4 py-2 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[var(--bg)]"
            />
            {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Custom Alias (optional)</label>
            <input
              type="text"
              placeholder="my-custom-link"
              {...register('customAlias')}
              className="w-full px-4 py-2 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[var(--bg)]"
            />
            {errors.customAlias && <p className="text-red-500 text-xs mt-1">{errors.customAlias.message}</p>}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-[var(--accent)] text-white py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
          >
            {mutation.isPending ? 'Shortening...' : 'Shorten URL'}
          </button>

          {mutation.isError && (
             <p className="text-red-500 text-sm text-center">
                {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
             </p>
          )}
        </form>

        {shortenedUrl && (
          <div className="mt-8 p-6 border border-[var(--accent-border)] rounded-lg bg-[var(--accent-bg)] flex flex-col items-center">
            <p className="text-lg font-medium mb-4 text-center break-all text-[var(--text-h)]">
              <a href={shortenedUrl} target="_blank" rel="noreferrer" className="hover:underline">
                {shortenedUrl}
              </a>
            </p>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-6 text-sm"
            >
              Copy to Clipboard
            </button>
            <div className="bg-white p-2 rounded-lg">
              <QRCodeSVG value={shortenedUrl} size={150} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
