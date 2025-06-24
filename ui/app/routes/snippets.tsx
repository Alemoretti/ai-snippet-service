import { useState, useEffect } from 'react';
import { Layout } from '~/components/Layout';

interface Summary {
  id: string;
  title: string;
  text: string;
  summary: string;
  createdAt: string;
}

interface ApiSummary {
  id: string;
  title: string;
  text: string;
  summary: string;
  createdAt: string;
}

export default function SnippetsPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    void fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const response = await fetch('/api/snippets');
      if (response.ok) {
        const data = (await response.json()) as ApiSummary[];
        setSummaries(
          data.map((item) => ({
            id: item.id,
            title: item.title,
            text: item.text,
            summary: item.summary,
            createdAt: item.createdAt,
          })),
        );
      } else {
        setError('Failed to load summaries');
      }
    } catch (error) {
      setError('Failed to load summaries');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSummaries = summaries.filter(
    (summary) =>
      summary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.summary.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Summaries</h1>

        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!error && (
            <div>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search summaries..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : filteredSummaries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    {searchTerm
                      ? 'No summaries found matching your search.'
                      : 'No summaries yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredSummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {summary.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {summary.text.length > 100
                          ? `${summary.text.substring(0, 100)}...`
                          : summary.text}
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <p className="text-blue-900 font-medium mb-1">
                          AI Summary:
                        </p>
                        <p className="text-blue-800">{summary.summary}</p>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        Created:{' '}
                        {new Date(summary.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
