# RetroAlert Component Usage Guide

A custom alert/modal system that matches your app's retro design aesthetic.

## Features

✅ Beautiful retro styling matching Community Reviews modal  
✅ Replaces native `Alert.alert()` with styled modal  
✅ Supports multiple buttons with different styles  
✅ Easy to use with React hook  
✅ Scrollable message content  

## Quick Start

### 1. Import the Hook

```typescript
import { useRetroAlert } from '../hooks/useRetroAlert';
```

### 2. Initialize in Component

```typescript
export const YourScreen = () => {
  const { showAlert, AlertComponent } = useRetroAlert();
  
  // Your component code...
};
```

### 3. Add AlertComponent to JSX

```typescript
return (
  <View>
    {/* Your screen content */}
    
    {/* Add this at the end, before closing </View> */}
    <AlertComponent />
  </View>
);
```

### 4. Show Alerts

```typescript
// Simple alert
showAlert('Success', 'Profile updated successfully!');

// Alert with custom buttons
showAlert(
  'Delete Item',
  'Are you sure you want to delete this?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => handleDelete() }
  ]
);
```

## Button Styles

- **`default`** - Golden yellow button (primary action)
- **`cancel`** - Gray button (cancel/dismiss)
- **`destructive`** - Red button (delete/dangerous actions)

## Examples

### Username Validation

```typescript
if (!username.trim()) {
  showAlert('Username Required', 'Please enter a username');
  return;
}
```

### Confirmation Dialog

```typescript
const handleDelete = () => {
  showAlert(
    'Confirm Delete',
    'This action cannot be undone. Are you sure?',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          await deleteItem();
        }
      }
    ]
  );
};
```

### Success Message

```typescript
showAlert('Success!', 'Your changes have been saved.');
```

### Error Handling

```typescript
try {
  await saveData();
} catch (error) {
  showAlert('Error', error.message || 'Something went wrong');
}
```

## Files

- **Component**: `src/components/RetroAlert.tsx`
- **Hook**: `src/hooks/useRetroAlert.tsx`

## Migration from Alert.alert

Replace:
```typescript
import { Alert } from 'react-native';
Alert.alert('Title', 'Message');
```

With:
```typescript
import { useRetroAlert } from '../hooks/useRetroAlert';

const { showAlert, AlertComponent } = useRetroAlert();
showAlert('Title', 'Message');

// Add to JSX:
<AlertComponent />
```

## Styling

The RetroAlert automatically matches your app's theme using `RetroTheme.colors` and `RetroTheme.shadows`. It uses:

- `layer1` background
- `primary` color for buttons
- `border` for outlines
- Retro shadows and border radius
- Same styling as Community Reviews modal

## Next Steps

To replace all Alert.alert() calls in the app:

1. Search for `Alert.alert` in the codebase
2. Add `useRetroAlert()` hook to each screen
3. Replace `Alert.alert()` with `showAlert()`
4. Add `<AlertComponent />` to JSX
5. Remove `Alert` from imports

Found in:
- ProfileSetupScreen ✅ (already updated)
- GameDetailsScreen (remove from library confirmation)
- Other screens with alerts
