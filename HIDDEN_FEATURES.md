# Hidden Features Configuration

The following feature flags control the visibility of certain UI elements in the application.

## Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `HIDEEX_FUNCTION` | If `true`, hides the "Plugins" settings menu. | `false` |
| `HIDE_BETAFUN` | If `true`, hides the "Experimental" features menu. | `false` |
| `HIDE_CLOUDSYNC` | If `true`, hides the "Cloud" sync function. | `false` |

## How to Configure

Modify `web-client/lib/config.ts` to change these values.

```typescript
export const HIDEEX_FUNCTION = false;
export const HIDE_BETAFUN = false;
export const HIDE_CLOUDSYNC = false;
```
