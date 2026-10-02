import type { CapabilityLevel, ChecklistItem, FieldSchema, FieldType, ItemStatus, ReviewedItem } from '../types'
import { meetsMinimum } from './capability'

/**
 * Returns the ordered FieldSchema list applicable to one item.
 * If the item declares a `fields` override, only those ids are returned (in
 * that order). Otherwise all top-level fields are returned.
 */
export function resolveItemFields(item: ChecklistItem, allFields: FieldSchema[]): FieldSchema[] {
  if (!item.fields || item.fields.length === 0) return allFields
  return item.fields
    .map(id => allFields.find(f => f.id === id))
    .filter((f): f is FieldSchema => f !== undefined)
}

/**
 * Returns the ids of fields that are mandatory given the current status.
 */
export function getRequiredFieldIds(fields: FieldSchema[], status: ItemStatus): string[] {
  return fields
    .filter(f => f.requiredWhen && f.requiredWhen.includes(status))
    .map(f => f.id)
}

/**
 * Returns true if the item is complete:
 *   - status is not 'pending'
 *   - all fields visible to the user and required for the current status have a non-empty value
 */
export function isItemComplete(
  item: ReviewedItem,
  fields: FieldSchema[],
  userCapability: CapabilityLevel,
): boolean {
  if (item.status === 'pending') return false

  const lastAction = item.history[item.history.length - 1]
  const fieldValues = lastAction?.fieldValues ?? {}

  const visibleFields = fields.filter(f => meetsMinimum(userCapability, f.visibleTo ?? 'observer'))
  const requiredIds = getRequiredFieldIds(visibleFields, item.status)

  return requiredIds.every(id => {
    const val = fieldValues[id]
    return val !== undefined && val.trim().length > 0
  })
}

/**
 * Maps a FieldType to the corresponding HTML input type string.
 * Unknown types fall back to 'textarea'.
 */
export function fieldTypeToInputType(type: FieldType | string): string {
  const map: Record<string, string> = {
    text: 'text',
    textarea: 'textarea',
    select: 'select',
    url: 'url',
    boolean: 'checkbox',
    date: 'date',
  }
  return map[type] ?? 'textarea'
}
