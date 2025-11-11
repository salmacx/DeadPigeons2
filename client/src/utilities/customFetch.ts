import type {ProblemDetails} from "@core/problemdetails.ts";
import toast from "react-hot-toast";
import {resolveRefs} from "dotnet-json-refs";

export const customFetch = {
    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        const token = localStorage.getItem('jwt');
        const headers = new Headers(init?.headers);

        if (token) {
            headers.set('Authorization', token);
        }

        return fetch(url, {
            ...init,
            headers
        }).then(async (response) => {
            // Clone the response FIRST before reading the body
            const clonedResponse = response.clone();

            if (!response.ok) {
                const problemDetails = (await response.json()) as ProblemDetails;
                console.log(problemDetails)
                toast(problemDetails.title)
            }

            // Check if response is JSON
            const contentType = clonedResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    const data = await clonedResponse.json();
                    const resolvedData = resolveRefs(data);

                    // Create a new response with resolved data
                    return new Response(JSON.stringify(resolvedData), {
                        status: clonedResponse.status,
                        statusText: clonedResponse.statusText,
                        headers: clonedResponse.headers
                    });
                } catch (e) {
                    // If parsing fails, return original response
                    return clonedResponse;
                }
            }

            // Return original response for non-JSON responses
            return clonedResponse;
        });
    }
};