# @kids/utils

Shared utilities for Kids Coding Platform.

## Features

- **Format utilities**: Duration, numbers, file sizes
- **Validation utilities**: Email, UUID, range checks
- **Constants**: Application constants, API endpoints, user roles

## Usage

```typescript
import { formatDuration, isValidEmail, APP_CONSTANTS } from '@kids/utils';

// Format duration
const duration = formatDuration(1500); // "1s"

// Validate email
const isValid = isValidEmail('user@example.com'); // true

// Use constants
const maxSize = APP_CONSTANTS.MAX_FILE_SIZE; // 10485760
```

## API

### Format

- `formatDuration(ms: number): string` - Format milliseconds to human-readable duration
- `formatNumber(num: number): string` - Format number with commas
- `formatFileSize(bytes: number): string` - Format bytes to human-readable file size

### Validation

- `isValidEmail(email: string): boolean` - Check if string is valid email
- `isValidUUID(uuid: string): boolean` - Check if string is valid UUID
- `isNotEmpty(str: string): boolean` - Check if string is not empty
- `isInRange(value: number, min: number, max: number): boolean` - Check if number is in range

### Constants

- `APP_CONSTANTS` - Application constants
- `API_ENDPOINTS` - API endpoint definitions
- `USER_ROLES` - User role definitions
- `LEARNING_LEVELS` - Learning level definitions
