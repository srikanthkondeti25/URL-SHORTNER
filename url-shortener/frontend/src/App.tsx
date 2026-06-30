import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateLinkSchema, type CreateLinkRequest } from 'shared';
import { Link2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

function App() {
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateLinkRequest>({
    resolver: zodResolver(CreateLinkSchema),
  });

  const onSubmit = async (data: CreateLinkRequest) => {
    setError(null);
    setShortUrl(null);
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to shorten URL');
      }

      setShortUrl(result.shortUrl);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center mb-8">
          <Link2 className="w-10 h-10 text-primary mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">URL Shortener</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Original URL
            </label>
            <input
              type="text"
              id="url"
              placeholder="https://example.com/very-long-url"
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary ${
                errors.url ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('url')}
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-500">{errors.url.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="customAlias" className="block text-sm font-medium text-gray-700 mb-1">
              Custom Alias (Optional)
            </label>
            <input
              type="text"
              id="customAlias"
              placeholder="my-custom-link"
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary ${
                errors.customAlias ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('customAlias')}
            />
            {errors.customAlias && (
              <p className="mt-1 text-sm text-red-500">{errors.customAlias.message as string}</p>
            )}
          </div>

          {error && (
            <div className="flex items-center text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Shortening...' : 'Shorten URL'}
          </button>
        </form>

        {shortUrl && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Your shortened URL</h2>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shortUrl}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none text-gray-700"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
            <div className="mt-4 flex justify-center">
                <QRCodeSVG value={shortUrl} size={128} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
