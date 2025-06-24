import { Layout } from '~/components/Layout';

export default function CreatePage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Create New Snippet
        </h1>

        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 text-center py-12">
            Test
          </p>
        </div>
      </div>
    </Layout>
  );
}
