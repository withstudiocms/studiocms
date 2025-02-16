import { defineDb } from 'astro:db';
import { tables } from './tables.js';

// Export the Database Configuration for StudioCMS
export default defineDb({ tables });
