import type { MetaFunction } from '@remix-run/node';
import { Layout } from '~/components/Layout';

export const meta: MetaFunction = () => {
  return [
    { title: 'AI Snippet Service' },
    {
      name: 'description',
      content: 'Get summaries of your code snippets with AI',
    },
  ];
};

export default function Index() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Snippet Service
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get summaries of your code snippets with AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Browse Snippets
            </h2>
            <p className="text-gray-600 mb-6">
              Browse your snippets with the summaries..
            </p>
            <a
              href="/snippets"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Snippets
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Create New Snippet
            </h2>
            <p className="text-gray-600 mb-6">
              Add a new snippet and get a summary .
            </p>
            <a
              href="/create"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Snippet
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
