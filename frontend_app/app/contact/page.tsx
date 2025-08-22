"use client";

import { Mail, Phone, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16 px-6 flex flex-col items-center">
      <div className="max-w-3xl text-center mb-12">
        <h1 className="text-5xl font-extrabold text-green-700 mb-4">
          Get in Touch with ResearchHive 📬
        </h1>
        <p className="text-lg text-gray-700">
          We’d love to hear your feedback, questions, or collaboration ideas.
          The hive is always buzzing with curiosity!
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        {[
          { icon: Mail, title: "Email Us", info: "ravalvyom17@gmail.com" },
          { icon: Phone, title: "Call Us", info: "+91 94095 41314" },
          {
            icon: MessageCircle,
            title: "Community Forum",
            info: "Join our hive discussion forum.",
          },
        ].map((c, i) => (
          <div
            key={i}
            className="p-6 bg-white rounded-xl shadow hover:shadow-md transition text-center"
          >
            <c.icon className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-green-700 mb-2">
              {c.title}
            </h3>
            <p className="text-gray-600">{c.info}</p>
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="mt-16 w-full max-w-2xl bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-green-700 mb-4">
          Send us a message 📝
        </h2>
        <form className="grid gap-4">
          <input
            type="text"
            placeholder="Your Name"
            className="border rounded-lg p-3 w-full"
          />
          <input
            type="email"
            placeholder="Your Email"
            className="border rounded-lg p-3 w-full"
          />
          <textarea
            placeholder="Your Message"
            rows={5}
            className="border rounded-lg p-3 w-full"
          ></textarea>
          <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}
