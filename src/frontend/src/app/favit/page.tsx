"use client";

import { useState } from "react";
import { ReportCard, VendorAnalysisResponse } from "@/components/favit/ReportCard";

// Define the structure of the request body for the new API endpoint
interface VendorAnalysisRequest {
  vendor_name: string;
  model: string; // Or a more specific enum/type if you have one
}

export default function FavitPage() {
  const [vendorName, setVendorName] = useState("");
  const [analysis, setAnalysis] = useState<VendorAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!vendorName) {
      setError("Please enter a vendor name.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const requestBody: VendorAnalysisRequest = {
        vendor_name: vendorName,
        model: "gpt-4o", // Using a default model, this could be a user selection
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analyze_vendor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch analysis.");
      }

      const data: VendorAnalysisResponse = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
          Fraud Analyst's Vendor Intelligence Terminal
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Enter a vendor name to perform a real-time risk assessment.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            placeholder="e.g., LEMRBEE.COM"
            className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {error && <p className="text-red-500 text-center my-4">{error}</p>}

        <div className="mt-6">
          {analysis && <ReportCard analysis={analysis} />}
        </div>
      </div>
    </div>
  );
}
