import type { APIRoute } from 'astro';
import { AllResponse, OptionsResponse } from 'studiocms/lib/endpointResponses';

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET', 'POST']);

export const ALL: APIRoute = async () => AllResponse();
