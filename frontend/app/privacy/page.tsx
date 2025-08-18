"use client";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-6 flex flex-col items-center">
      <div className="max-w-3xl">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-6">
          Privacy Policy 🔒
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          At <span className="font-semibold">ResearchHive</span>, we value your
          trust and privacy. This policy describes how we handle your data with
          care — because every hive needs to keep its nectar safe.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            1. Data Collection
          </h2>
          <p className="text-gray-600">
            We only collect information necessary to provide services, like
            email and research uploads. No unnecessary harvesting of your data
            🐝.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            2. Data Usage
          </h2>
          <p className="text-gray-600">
            Your papers are processed securely by AI models only for content
            transformation, not for resale or external distribution.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            3. Data Protection
          </h2>
          <p className="text-gray-600">
            We implement encryption and secure storage to safeguard your
            research, just like bees guard their honeycomb.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            4. Your Control
          </h2>
          <p className="text-gray-600">
            You can request data deletion anytime. Your hive, your rules.
          </p>
        </section>
      </div>
    </main>
  );
}
