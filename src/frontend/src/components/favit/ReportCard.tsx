"use client";

import React from "react";

// Define the TypeScript interfaces for the analysis data
// This should match the Pydantic models in the backend
interface KeyEvidence {
  source: string;
  quote: string;
}

interface OfficialPresence {
  website: string;
  location: string;
}

interface ReviewProfile {
  trustpilot: string;
  other_platforms: string;
}

export interface VendorAnalysisResponse {
  vendor_name: string;
  risk_score: number;
  risk_level: string;
  executive_summary: string;
  official_presence: OfficialPresence;
  review_profile: ReviewProfile;
  key_evidence: KeyEvidence[];
}

interface ReportCardProps {
  analysis: VendorAnalysisResponse;
}

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel.toLowerCase()) {
    case "critical":
      return "bg-red-100 border-red-500 text-red-700";
    case "high":
      return "bg-orange-100 border-orange-500 text-orange-700";
    case "medium":
      return "bg-yellow-100 border-yellow-500 text-yellow-700";
    case "low":
      return "bg-green-100 border-green-500 text-green-700";
    default:
      return "bg-gray-100 border-gray-500 text-gray-700";
  }
};

export const ReportCard: React.FC<ReportCardProps> = ({ analysis }) => {
  const riskColor = getRiskColor(analysis.risk_level);

  return (
    <div className="bg-white shadow-lg rounded-lg border-t-8 border-blue-600 p-6 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Vendor Report:{" "}
          <span className="text-blue-700">{analysis.vendor_name}</span>
        </h2>
      </div>

      {/* Risk Level and Score */}
      <div className={`p-4 rounded-md border ${riskColor} mb-6`}>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">
             {analysis.risk_level.toUpperCase()} RISK
          </span>
          <span className="text-2xl font-bold">
            {analysis.risk_score}/100
          </span>
        </div>
        <p className="mt-2 text-sm">{analysis.executive_summary}</p>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Official Presence</h3>
          <p className="text-sm">
            <strong>🌐 Website:</strong>{" "}
            <a href={analysis.official_presence.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {analysis.official_presence.website || "Not Found"}
            </a>
          </p>
          <p className="text-sm">
            <strong>📍 Location:</strong> {analysis.official_presence.location || "Not Found"}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Review Profile</h3>
          <p className="text-sm">
            <strong>⭐ Trustpilot:</strong> {analysis.review_profile.trustpilot || "Not Found"}
          </p>
          <p className="text-sm">
            <strong>👥 Other Reports:</strong> {analysis.review_profile.other_platforms || "None Found"}
          </p>
        </div>
      </div>

      {/* Key Evidence Section */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Key Evidence</h3>
        <div className="space-y-4">
          {analysis.key_evidence.map((evidence, index) => (
            <div key={index} className="border-l-4 border-gray-300 pl-4">
              <p className="font-semibold text-gray-600">{evidence.source}</p>
              <blockquote className="text-gray-700 italic">
                "{evidence.quote}"
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Add a simple fade-in animation to tailwind config if needed, or define here
// For simplicity, we can add a style tag or rely on existing CSS.
// Let's assume a basic animation is available.
const styles = `
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// A simple component to inject the styles
export const StyleInjector: React.FC = () => {
    return <style>{styles}</style>;
}
