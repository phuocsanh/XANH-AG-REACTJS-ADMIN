# API Refactor Guide for Frontend Team

## Overview
This document outlines the recent API changes focused on standardizing data retrieval endpoints. The primary change across multiple modules is the replacement of `GET` list endpoints (often `findAll`) with `POST` search endpoints. This change enhances security and flexibility, allowing for complex filtering and pagination via the request body.

## General Changes
1.  **Endpoint Method**: `GET` -> `POST`
2.  **Endpoint Path**: `.../` or `.../list` -> `.../search` (or `.../searchAdvanced`)
3.  **Request Body**: Now requires a JSON body containing pagination and filter parameters.
4.  **Permissions**: Permissions are now strictly enforced on these search endpoints using `@RequirePermissions`.

## Common Request Body Format
Most search endpoints now accept a body structure similar to this (check specific DTOs for exact fields):
```json
{
  "page": 1,
  "limit": 20,
  "filters": [
    {
      "field": "status",
      "operator": "eq",
      "value": "ACTIVE"
    }
  ],
  "search": "optional search string"
}
```

## Module-Specific Changes

### 1. Customer (`/customers`)
*   **Removed**: `GET /customers`
*   **Added**: `POST /customers/search`
*   **Payload**:
    ```json
    {
      "page": 1,
      "limit": 20,
      "search": "name or phone"
    }
    ```
*   **Permission**: `SALES_VIEW`

### 2. Sales (`/sales`)
*   **Removed**: `GET /sales/invoices`
*   **Updated**: `POST /sales/invoices/search` (Use this for all list retrieval)
*   **Payload**: `SearchSalesDto` (includes `page`, `limit`, `filters`, `nested_filters`)
*   **Permission**: `SALES_VIEW`

### 3. Rice Crop (`/rice-crops`)
*   **Removed**: `GET /rice-crops`
*   **Added**: `POST /rice-crops/search`
*   **Payload**:
    ```json
    {
      "page": 1,
      "limit": 20,
      "customer_id": 123,
      "season_id": 456,
      "status": "ACTIVE",
      "growth_stage": "TILLERING"
    }
    ```
*   **Permission**: `rice_crop:read`

### 4. Cost Item (`/cost-items`)
*   **Removed**: `GET /cost-items`
*   **Added**: `POST /cost-items/search`
*   **Payload**:
    ```json
    {
      "page": 1,
      "limit": 20,
      "rice_crop_id": 123,
      "category": "FERTILIZER"
    }
    ```
*   **Permission**: `cost_item:read`

### 5. Inventory (`/inventory`)
*   **Removed**: `GET /inventory/batches`
*   **Use**: `POST /inventory/batches/search`
*   **Payload**: `SearchInventoryDto`
*   **Permission**: `INVENTORY_VIEW`

### 6. Debt Note (`/debt-notes`)
*   **Removed**: `GET /debt-notes`
*   **Use**: `POST /debt-notes/search`
*   **Payload**: `SearchDebtNoteDto` (Supports `season_id` filter and returns summary stats)
*   **Permission**: `SALES_VIEW`

### 7. Product (`/products`)
*   **Removed**: `GET /products`
*   **Use**: `POST /products/search-advanced`
*   **Permission**: `PRODUCT_VIEW`

### 8. User (`/users`)
*   **Removed**: `GET /users`
*   **Use**: `POST /users/search`
*   **Permission**: `USER_VIEW`

### 9. Operating Cost (`/operating-costs`)
*   **Removed**: `GET /operating-costs`
*   **Use**: `POST /operating-costs/search-advanced`
*   **Permission**: `OPERATING_COST_VIEW`

### 10. Product Type (`/product-types`)
*   **Removed**: `GET /product-types`
*   **Use**: `POST /product-types/search`
*   **Permission**: `PRODUCT_VIEW`

### 11. Supplier (`/suppliers`)
*   **Removed**: `GET /suppliers`
*   **Use**: `POST /suppliers/search`
*   **Permission**: `INVENTORY_VIEW`

### 12. Unit (`/units`)
*   **Removed**: `GET /units`
*   **Use**: `POST /units/search`
*   **Permission**: `PRODUCT_VIEW`

### 13. Product Subtype (`/product-subtype`)
*   **Removed**: `GET /product-subtype`
*   **Use**: `POST /product-subtype/search`
*   **Permission**: `PRODUCT_VIEW`

### 14. Symbol (`/symbols`)
*   **Removed**: `GET /symbols`
*   **Use**: `POST /symbols/search`
*   **Permission**: `PRODUCT_VIEW`

### 15. Season (`/season`)
*   **Removed**: `GET /season`
*   **Note**: Use `GET /season/active` for active season or verify if a search endpoint is needed (currently minimal).

### 16. File Tracking (`/file-tracking`)
*   **Removed**: `GET /file-tracking`
*   **Note**: Access specific files via ID or Public ID.

## Action Items for FE Team
1.  **Audit**: Search codebase for all usage of the "Removed" endpoints listed above.
2.  **Refactor**: Switch the API call to the corresponding `POST` search endpoint.
3.  **Update Services**: Update your API service methods to accept `page`, `limit`, and `filters` as body parameters instead of query params.
4.  **Test**: Verify that lists load correctly and filtering/pagination works as expected.
