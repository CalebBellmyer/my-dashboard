import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

function extractJsonFromXml(xmlString: string): string | null {
    const stringTagStart = '<string xmlns="http://tempuri.org/">';
    const stringTagEnd = '</string>';
    
    let startPos = xmlString.indexOf(stringTagStart);
    if (startPos == -1) {
        const altStringTagStart = '</string>';
        startPos = xmlString.indexOf(altStringTagStart);
        if (startPos == -1) {
            console.error("Could not find start <string> tag in XML response.");
            return null;
        }
        startPos += altStringTagStart.length;

    } else {
        startPos += stringTagStart.length;
    }

    const endPos = xmlString.indexOf(stringTagEnd, startPos);
    if (endPos === -1) {
        console.error("Could not find end of </string> tag in XML response");
        return null;
    }

    if (startPos >= endPos) {
        console.error("Invalid start/end position for JSON content in XML");
        return null;
    }
    return xmlString.substring(startPos, endPos);
}

export const GET: RequestHandler = async ({ fetch }) => {
    const targetUrl = "https://www.megamillions.com/cmspages/utilservice.asmx/GetLatestDrawData";

    try {
        console.log("Lotto API: Fetching data from", targetUrl);
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'SvelteKit-Lotto-Widget/1.0'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Lotto API error: ${response.status} ${response.statusText}`, errorText);
            throw error(response.status, `Failed to fetch lotto data: ${response.status || response.statusText}`)
        }

        const xmlResponse = await response.text()
        const jsonString = extractJsonFromXml(xmlResponse);

        if (!jsonString) {
            console.error("Lotto API: Failed to extract JSON from XML.");
            throw error(500, 'Failed to process lotto data response.');
        }

        const lottoData = JSON.parse(jsonString);

        const nextJackpotAnnuity = lottoData.Jackpot?.NextPrizePool;
        const nextJackpotCash = lottoData.Jackpot?.NextCashValue;
        const nextDrawingDateString = lottoData.NextDrawingDate;

        if (nextJackpotAnnuity === undefined || nextJackpotCash === undefined || nextDrawingDateString === undefined) {
            console.error("Lotto API: Required fields (jackpot, cash value, or drawing date) missing from JSON data.", lottoData);
            throw error(500, 'Lotto data is in an unexpected format.');
        }

        return json({
            nextJackpotAnnuity,
            nextJackpotCash,
            nextDrawingDate: nextDrawingDateString,
        });
    } catch (e: any) {
        console.error('Error in /api/lotto-info endpoint:', e);
        if (e.status && e.body) {
        throw e;
        }
        throw error(500, e.message || 'An internal server error occurred while fetching lotto info.');
    }
}
