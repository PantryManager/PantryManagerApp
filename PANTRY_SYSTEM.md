# Pantry Management System - Implementation Guide

## Overview

A complete pantry management system with FDC API integration, allowing users to search, add, and track food items with expiration dates.

## Architecture

### Data Flow

```
User Search → FDC API → Search Results → User Selects →
Auto-create FoodItem (if new) → Create UserFoodItem → Display in Pantry
```

### Key Design Decisions

1. **Lazy Loading**: FoodItems are only created when users add them to their pantry
2. **Deduplication**: Multiple users can share the same FoodItem (via fdcId)
3. **External API Integration**: FDC provides the master food database
4. **Prepopulated Units**: Common measurement units are seeded at setup

## API Endpoints

### Pantry Management

#### `GET /api/pantry`
- Fetches all pantry items for authenticated user
- Returns items with `foodItem` and `unit` relations
- Ordered by expiration date (ascending), then purchase date (descending)

#### `POST /api/pantry`
- Adds new item to user's pantry
- **Auto-creates FoodItem** if fdcId doesn't exist
- Required fields:
  - `fdcId` (number)
  - `foodName` (string)
  - `foodCategory` (string)
  - `unitId` (string)
  - `quantity` (number)
  - `purchaseDate` (ISO date string)
  - `estimatedExpirationDate` (optional, ISO date string)

#### `PATCH /api/pantry/[id]`
- Updates existing pantry item
- Validates ownership before update
- Supports partial updates

#### `DELETE /api/pantry/[id]`
- Deletes pantry item
- Validates ownership before deletion

### Food Items

#### `GET /api/food-items/search?q=query`
- Searches FDC API (does NOT save to database)
- Minimum query length: 2 characters
- Returns max 20 results
- Response format:
```json
{
  "results": [
    {
      "fdcId": 123456,
      "name": "Chicken breast, raw",
      "category": "Poultry Products",
      "dataType": "SR Legacy",
      "brandOwner": "Generic"
    }
  ],
  "totalHits": 150
}
```

### Units

#### `GET /api/units`
- Returns all available measurement units
- Prepopulated via seed script

## Database Schema

### Key Models

```prisma
model FoodItem {
  id       String   @id @default(uuid())
  name     String
  fdcId    Int?     @unique          // Optional, from FDC API
  category String
}

model UserFoodItem {
  id                      String    @id @default(uuid())
  userId                  String
  foodItemId              String
  unitId                  String
  quantity                Float
  purchaseDate            DateTime
  estimatedExpirationDate DateTime?  // TODO: AI estimation
}

model Unit {
  id          String  @id @default(uuid())
  shortName   String  @unique
  displayName String
}
```

## Frontend Components

### `/app/pantry/page.tsx`
- Main pantry view with data table
- Shows: food name, category, quantity, purchase date, expiration status
- Color-coded expiration badges:
  - **Red**: Expired or expires in ≤3 days
  - **Yellow**: Expires in 4-7 days
  - **Gray**: Expires in >7 days or no expiration
- Delete functionality with confirmation

### `/components/custom/AddPantryItemDialog.tsx`
- Modal dialog for adding pantry items
- **FDC Search**: Real-time search with debouncing recommended
- **Search Results**: Clickable list with food name, category, brand
- **Form Fields**:
  - Selected food (from search)
  - Quantity (number input)
  - Unit (dropdown)
  - Purchase date (date picker)
- Form validation before submission

## Setup Instructions

### 1. Environment Variables

Add to `.env`:
```env
FDC_API_KEY="your_fdc_api_key_here"
```

Get your FDC API key: https://fdc.nal.usda.gov/api-key-signup.html

### 2. Database Migration

```bash
# Run migration
npx prisma migrate dev --name add_pantry_models

# Generate Prisma client
npx prisma generate

# Seed units
npm run db:seed
```

### 3. Run Development Server

```bash
npm run dev
```

Navigate to `/pantry` to access the pantry management interface.

## TODO: AI Integration Points

### 1. Expiration Date Estimation
**Location**: `app/api/pantry/route.ts` (POST endpoint)

Current code (line 116):
```typescript
estimatedExpirationDate: estimatedExpirationDate
    ? new Date(estimatedExpirationDate)
    : null,
```

**Your task**:
- Create AI service to estimate expiration based on:
  - Food category
  - Purchase date
  - Storage conditions (optional user input)
- Call AI before creating UserFoodItem
- Store estimated date

**Suggested implementation**:
```typescript
// Create lib/ai/estimateExpiration.ts
export async function estimateExpirationDate(
  foodName: string,
  category: string,
  purchaseDate: Date
): Promise<Date | null> {
  // TODO: Call your AI model
  // Consider: OpenAI, Anthropic, or local model
  // Return estimated expiration date
}

// In POST /api/pantry:
const estimatedExpiration = estimatedExpirationDate
  ? new Date(estimatedExpirationDate)
  : await estimateExpirationDate(foodName, foodCategory, new Date(purchaseDate))
```

### 2. FDC API Data Fetching
**Location**: `app/api/food-items/search/route.ts`

Currently only searches. You may want to:
- Fetch detailed nutrition data from FDC
- Cache nutrition data for display
- Create separate endpoint: `GET /api/food-items/[fdcId]/nutrition`

## Testing the System

### Manual Test Flow

1. **Setup**:
   ```bash
   npm run db:seed  # Seed units
   ```

2. **Login**: Authenticate with GitHub

3. **Add Item**:
   - Navigate to `/pantry`
   - Click "Add Item"
   - Search for "chicken breast"
   - Select a result
   - Enter quantity: 2
   - Select unit: pounds
   - Select purchase date: today
   - Submit

4. **Verify**:
   - Item appears in table
   - Database has:
     - New FoodItem (if first time)
     - New UserFoodItem
   - Expiration badge shows (currently "No expiration")

5. **Delete**:
   - Click trash icon
   - Confirm deletion
   - Item removed from table

## API Request Examples

### Add Pantry Item
```bash
curl -X POST http://localhost:3000/api/pantry \
  -H "Content-Type: application/json" \
  -d '{
    "fdcId": 171477,
    "foodName": "Chicken breast, raw",
    "foodCategory": "Poultry Products",
    "unitId": "unit-uuid-here",
    "quantity": 2.5,
    "purchaseDate": "2025-10-19",
    "estimatedExpirationDate": null
  }'
```

### Search Foods
```bash
curl "http://localhost:3000/api/food-items/search?q=chicken"
```

## Troubleshooting

### FDC API Issues

**Error**: `FDC API not configured`
- **Fix**: Add `FDC_API_KEY` to `.env`

**Error**: `Failed to search FDC API` (429)
- **Fix**: FDC has rate limits (1000 requests/hour). Wait or upgrade API key.

### Database Issues

**Error**: `Unit not found`
- **Fix**: Run `npm run db:seed`

**Error**: `Foreign key constraint failed`
- **Fix**: Ensure unitId and foodItemId exist before creating UserFoodItem

## Future Enhancements

1. **Edit Functionality**: Update existing pantry items
2. **Bulk Operations**: Add multiple items at once
3. **Filters & Search**: Filter by category, expiration, etc.
4. **Nutrition Display**: Show nutritional info from FDC
5. **Recipe Suggestions**: AI-powered recipes based on pantry
6. **Shopping List**: Generate list based on expired/low items
7. **Barcode Scanning**: Mobile UPC lookup via FDC
8. **Notifications**: Alert users of expiring items

## File Structure

```
app/
├── api/
│   ├── pantry/
│   │   ├── route.ts          # GET, POST
│   │   └── [id]/route.ts     # PATCH, DELETE
│   ├── food-items/
│   │   └── search/route.ts   # GET (FDC search)
│   └── units/
│       └── route.ts          # GET
└── pantry/
    └── page.tsx              # Main pantry UI

components/custom/
└── AddPantryItemDialog.tsx   # Add item modal

prisma/
├── schema.prisma             # Database schema
└── seed.ts                   # Unit seeding script
```
