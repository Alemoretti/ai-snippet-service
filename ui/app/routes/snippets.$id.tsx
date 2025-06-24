import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '~/components/Layout';

interface Snippet {
  id: string;
  title: string;
  text: string;
  summary: string;
  createdAt: string;
}

export default function SnippetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      void fetchSnippet(id);
    }
  }, [id]);

  const fetchSnippet = async (snippetId: string) => {
    try {
      const response = await fetch(`/api/snippets/${snippetId}`);
      if (response.ok) {
        const data = (await response.json()) as Snippet;
        setSnippet(data);
      } else if (response.status === 404) {
        setError('Snippet not found');
      } else {
        setError('Failed to load snippet');
      }
    } catch (error) {
      setError('Failed to load snippet');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <Link
              to="/snippets"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              ← Back to Summaries
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!snippet) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Snippet not found</p>
            <Link
              to="/snippets"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              ← Back to Summaries
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/snippets"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Summaries
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Snippet Details
        </h1>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {snippet.title}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Created: {new Date(snippet.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Content:</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-gray-800 whitespace-pre-wrap">
                {snippet.text}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              AI Summary:
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-900">{snippet.summary}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
