import OpenAI from "openai";
import type { ProposalScanResult } from "@/lib/types/proposal";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const PROPOSAL_ANALYZER_PROMPT = `You are a wedding proposal document analyzer. Given a wedding vendor proposal/contract PDF, extract the following structured information.

Return a JSON object with these fields:
{
  "vendorName": "The vendor or company name",
  "vendorEmail": "Contact email if found, or null",
  "vendorPhone": "Contact phone if found, or null",
  "vendorWebsite": "Website URL if found, or null",
  "category": "One of: venue, catering, photography, videography, florist, dj, band, planner, officiant, hair_makeup, cake, transportation, rentals, lighting, stationery, other",
  "totalCost": "Total cost as a number (no currency symbols), or null",
  "depositAmount": "Deposit/retainer amount as a number, or null",
  "depositDueDate": "Deposit due date in ISO format (YYYY-MM-DD), or null",
  "paymentSchedule": [
    {
      "description": "Description of the payment",
      "amount": "Amount as a number",
      "dueDate": "Due date in ISO format, or null"
    }
  ],
  "services": ["List of services/items included"],
  "eventDate": "Event/wedding date in ISO format if mentioned, or null",
  "eventLocation": "Event venue/location if mentioned, or null",
  "cancellationPolicy": "Brief summary of cancellation/refund policy, or null",
  "notes": "Any other important details, terms, or conditions worth noting",
  "confidence": "A number from 0 to 1 indicating how confident you are in the extraction accuracy"
}

Important:
- Extract exact numbers for costs, not ranges (use the higher number if a range is given).
- Dates should be in ISO 8601 format (YYYY-MM-DD).
- If a field cannot be determined from the text, set it to null.
- The services array should list distinct line items or services mentioned.
- Be thorough but concise in the notes field.
- Return ONLY valid JSON, no other text.`;

async function downloadPdfAsBase64(fileUrl: string): Promise<string> {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download PDF: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return base64;
}

function extractJson(responseText: string): ProposalScanResult {
  let jsonString = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim();
  }
  return JSON.parse(jsonString);
}

export async function parseProposal(
  fileUrl: string
): Promise<ProposalScanResult> {
  const openai = getOpenAI();
  const pdfBase64 = await downloadPdfAsBase64(fileUrl);

  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: "proposal.pdf",
            file_data: `data:application/pdf;base64,${pdfBase64}`,
          },
          {
            type: "input_text",
            text: PROPOSAL_ANALYZER_PROMPT,
          },
        ],
      },
    ],
  });

  const responseText = response.output_text;

  return extractJson(responseText);
}

export async function parseProposalFromText(
  text: string
): Promise<ProposalScanResult> {
  const openai = getOpenAI();

  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "user",
        content: `${PROPOSAL_ANALYZER_PROMPT}\n\nHere is the proposal document text:\n\n---\n${text}\n---`,
      },
    ],
  });

  const responseText = response.output_text;

  return extractJson(responseText);
}
