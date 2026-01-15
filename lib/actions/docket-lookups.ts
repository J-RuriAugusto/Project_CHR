'use server';

import { createClient } from '@/utils/supabase/server';

export interface LookupItem {
    id: number;
    name: string;
}

export interface DocketLookups {
    requestTypes: LookupItem[];
    violationCategories: LookupItem[];
    requestModes: LookupItem[];
    humanRights: LookupItem[];
}

/**
 * Fetch all request types from the database
 */
export async function getRequestTypes(): Promise<LookupItem[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('request_types')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Error fetching request types:', error);
        return [];
    }

    return data || [];
}

/**
 * Fetch all violation categories from the database
 * NOTE: Table removed, returning empty array as categories are now open text
 */
export async function getViolationCategories(): Promise<LookupItem[]> {
    return [];
}

/**
 * Fetch all request modes from the database
 */
export async function getRequestModes(): Promise<LookupItem[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('request_modes')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Error fetching request modes:', error);
        return [];
    }

    return data || [];
}

/**
 * Fetch all human rights from the database
 * NOTE: Table removed, returning empty array as rights are now open text
 */
export async function getHumanRights(): Promise<LookupItem[]> {
    return [];
}

/**
 * Fetch all docket lookup data in a single optimized call
 */
export async function getAllDocketLookups(): Promise<DocketLookups> {
    const [requestTypes, requestModes] = await Promise.all([
        getRequestTypes(),
        getRequestModes(),
    ]);

    return {
        requestTypes,
        violationCategories: [],
        requestModes,
        humanRights: [],
    };
}
