# App Icons

To complete the PWA setup, you need to generate app icons in multiple sizes from your logo (Jetsuitewing.png).

## Required Icon Sizes

The following icon sizes are needed for the Progressive Web App:
- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px
- 384x384px
- 512x512px

## How to Generate Icons

You can use online tools or command-line utilities to generate these icons:

### Option 1: Online Tool
Use https://www.pwabuilder.com/imageGenerator or similar PWA icon generators. Upload your logo and it will generate all required sizes.

### Option 2: ImageMagick (Command Line)
If you have ImageMagick installed:

```bash
# From the public directory
convert Jetsuitewing.png -resize 72x72 icons/icon-72x72.png
convert Jetsuitewing.png -resize 96x96 icons/icon-96x96.png
convert Jetsuitewing.png -resize 128x128 icons/icon-128x128.png
convert Jetsuitewing.png -resize 144x144 icons/icon-144x144.png
convert Jetsuitewing.png -resize 152x152 icons/icon-152x152.png
convert Jetsuitewing.png -resize 192x192 icons/icon-192x192.png
convert Jetsuitewing.png -resize 384x384 icons/icon-384x384.png
convert Jetsuitewing.png -resize 512x512 icons/icon-512x512.png
```

### Option 3: Node.js Script
Create icons using sharp or jimp npm packages.

## Apple Touch Icons

For iOS devices, also consider adding apple-touch-icon links in your HTML:

```html
<link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png">
```

## Testing

After generating icons, test your PWA on:
- Chrome/Edge DevTools (Lighthouse PWA audit)
- Real mobile devices (Android & iOS)
- Safari on iOS (for "Add to Home Screen" functionality)
