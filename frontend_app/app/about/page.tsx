"use client";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-white py-16 px-6 flex flex-col items-center">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-extrabold text-yellow-600 mb-6">
          About ResearchHive 🐝
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Just like bees work together in a hive to create something bigger than
          themselves,{" "}
          <span className="font-semibold text-yellow-700">ResearchHive</span>{" "}
          brings AI-powered tools together to help you transform research papers
          into meaningful, engaging formats.
        </p>

        <div className="bg-yellow-100 border border-yellow-300 p-6 rounded-xl shadow-md">
          <p className="text-gray-800 text-lg">
            Our mission is to make research{" "}
            <span className="font-semibold text-yellow-700">
              accessible, interactive, and fun
            </span>{" "}
            — whether you’re a student, researcher, educator, or enthusiast.
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        {[
          {
            title: "AI + Knowledge",
            desc: "We blend research depth with AI intelligence to simplify complex topics.",
          },
          {
            title: "Creativity in Learning",
            desc: "Learning doesn’t have to be boring — ResearchHive makes it visual, auditory, and fun.",
          },
          {
            title: "Community of Curiosity",
            desc: "We believe everyone is a lifelong learner, buzzing around the hive of knowledge.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold text-yellow-600 mb-2">
              {item.title}
            </h3>
            <p className="text-gray-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
