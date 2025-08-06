import asyncio
from typing import List
from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.llm.base import EveryLLM
from backend.search.search_service import perform_search
from backend.schemas import SearchResponse

# 1. Define the input and output schemas (Pydantic Models)

class VendorAnalysisRequest(BaseModel):
    vendor_name: str = Field(..., description="The name of the vendor to analyze.")
    model: str

class KeyEvidence(BaseModel):
    source: str
    quote: str

class OfficialPresence(BaseModel):
    website: str
    location: str

class ReviewProfile(BaseModel):
    trustpilot: str
    other_platforms: str

class VendorAnalysisResponse(BaseModel):
    vendor_name: str
    risk_score: int
    risk_level: str
    executive_summary: str
    official_presence: OfficialPresence
    review_profile: ReviewProfile
    key_evidence: List[KeyEvidence]


# 2. Create the FastAPI router
router = APIRouter()

# 3. Define the System Prompt for the LLM
FAVIT_SYSTEM_PROMPT = """
# IDENTITY and PURPOSE
You are a specialized Fraud Intelligence Synthesis Engine. Your purpose is to analyze a collection of web search snippets about a specific online vendor and generate a structured JSON risk assessment for a fraud analyst. Your analysis must be fast, factual, and directly address the risk of financial fraud or deceptive business practices.

# INPUT
You will receive a block of text containing aggregated search results for a vendor. The results are from various queries like "scam reports," "reviews," and "billing practices."

# CORE DIRECTIVE & SCORING
Your primary task is to calculate a **Risk Score** (from 0 to 100, where higher is more risky) and classify the vendor's risk level. Start the score at 0 and add points based on the following rubric. Use your reasoning to apply points within the given ranges based on the severity and volume of evidence.

### Risk Scoring Rubric:
- **+40 to +50 points:** Widespread, credible reports of the vendor being an outright scam, phishing operation, or involved in identity theft.
- **+20 to +30 points:** Numerous reports of deceptive billing practices (e.g., hidden subscriptions, impossible to cancel, unauthorized charges).
- **+20 points:** No verifiable official website or a very new/unprofessional site.
- **+15 points:** A Trustpilot (or similar review platform) score below 3.0/5.
- **+10 points:** A significant volume of unresolved customer complaints about service, shipping, or refunds.
- **+5 points:** No review platform presence (e.g., no Trustpilot) or very few reviews (<50).
- **+5 points:** A general lack of online presence, making the vendor difficult to verify.

# OUTPUT INSTRUCTIONS
You MUST produce your output as a single, raw JSON object and nothing else. Do not wrap it in markdown or add explanations.
"""

# 4. Implement the API endpoint
@router.post("/analyze_vendor", response_model=VendorAnalysisResponse)
async def analyze_vendor(
    request: VendorAnalysisRequest,
):
    try:
        vendor_name = request.vendor_name

        # Step 1: Generate search queries
        queries = [
            f"what is {vendor_name}",
            f"{vendor_name} reviews",
            f"{vendor_name} scam report",
            f"{vendor_name} Trustpilot",
            f"{vendor_name} complaints BBB",
            f"{vendor_name} Reddit review",
            f"{vendor_name} cancel subscription",
            f"{vendor_name} billing issues",
        ]

        # Step 2: Perform searches in parallel
        search_tasks = [perform_search(query) for query in queries]
        search_results_list = await asyncio.gather(*search_tasks)

        # Step 3: Aggregate search results into a single context block
        context = ""
        for query, results in zip(queries, search_results_list):
            if results and results.results:
                context += f"--- Results for query: '{query}' ---\n"
                for item in results.results:
                    context += f"Title: {item.title}\n"
                    context += f"URL: {item.url}\n"
                    context += f"Snippet: {item.snippet}\n\n"

        if not context:
            # Handle case where no search results are found
            raise HTTPException(status_code=404, detail=f"No online presence found for vendor: {vendor_name}")

        # Step 4: Call the LLM for synthesis
        model = request.model
        llm = EveryLLM(model=model)

        user_prompt = f"Please analyze the following search results for the vendor '{vendor_name}':\n\n{context}"

        # The 'instructor' library uses the 'messages' parameter to pass prompts.
        analysis_response = llm.client.chat.completions.create(
            model=llm.llm.model,
            messages=[
                {"role": "system", "content": FAVIT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            response_model=VendorAnalysisResponse,
        )

        return analysis_response

    except Exception as e:
        # Log the exception for debugging
        print(f"Error during vendor analysis: {e}")
        # Re-raise as an HTTPException to be sent to the client
        raise HTTPException(status_code=500, detail=str(e))
