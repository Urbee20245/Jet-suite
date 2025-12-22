# Deployment Troubleshooting Guide

## Blank Screen Issue - Diagnosis & Fixes

### What I've Fixed

1. **✅ Vite Configuration**
   - Fixed ES module support with proper `__dirname` handling
   - Added explicit `base: '/'` for proper asset paths
   - Configured build output directory

2. **✅ Error Boundary**
   - Added comprehensive error boundary in `index.tsx`
   - Catches and displays React errors
   - Shows error details in development

3. **✅ Loading Indicator**
   - Added visible loading state in `index.html`
   - Shows "Jet Suite - Loading..." while JS loads
   - Helps identify if JS is loading at all

4. **✅ Defensive Coding**
   - Added `typeof window !== 'undefined'` checks
   - Added `typeof localStorage !== 'undefined'` checks
   - Wrapped all browser API calls in try-catch

5. **✅ Debug Logging**
   - Added console.log statements in App component
   - Helps trace execution flow

### How to Diagnose on Vercel

#### Step 1: Check Browser Console
Open your Vercel deployment URL and press F12 to open DevTools:

**Look for:**
- `[App] Component module loaded` - JS loaded successfully
- `[App] Component rendering` - React is trying to render
- `[App] Rendering with state: ...` - Shows current state
- Any error messages (red text)

#### Step 2: Check Network Tab
In DevTools → Network tab:

**Verify:**
- `index.html` - Should return 200 OK
- `index-*.js` - Should return 200 OK (not 404)
- `index-*.css` - Should return 200 OK (not 404)
- Google Fonts - Should load (not critical)

#### Step 3: Common Issues & Solutions

##### Issue: "Cannot read property of undefined"
**Solution:** Already fixed with defensive coding. If you still see this, the issue is in a component.

##### Issue: Assets return 404
**Cause:** Vercel isn't finding the built assets
**Solution:** 
- Verify `vercel.json` exists
- Check Vercel build settings use `npm run build`
- Ensure output directory is `dist`

##### Issue: Blank screen, no errors
**Cause:** CSS not loading or React not mounting
**Solution:**
- Check if loading indicator appears briefly
- If loading indicator stays → JS not loading
- If loading indicator disappears but blank → React error

##### Issue: "localStorage is not defined"
**Solution:** Already fixed with `typeof localStorage !== 'undefined'` checks

### Vercel Configuration Checklist

#### In Vercel Dashboard → Project Settings

**Build & Development Settings:**
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Environment Variables:**
```
GEMINI_API_KEY = your-api-key-here
```
⚠️ Note: Frontend apps expose env vars to the browser. Consider using backend API if sensitive.

**Root Directory:**
```
./
```
(Leave as default unless project is in a subdirectory)

### Testing Locally

Before deploying, test production build locally:

```bash
# Clean build
rm -rf dist node_modules package-lock.json
npm install
npm run build

# Preview production build
npm run preview
```

Visit http://localhost:4173 and check:
- ✅ Page loads without blank screen
- ✅ Console has no errors
- ✅ Navigation works
- ✅ All assets load

### Manual Diagnosis Commands

```bash
# Check if build succeeded
ls -la dist/

# Should see:
# - index.html
# - assets/ directory with JS and CSS files

# Check index.html content
cat dist/index.html

# Should see:
# - <script type="module" ... src="/assets/index-*.js">
# - <link rel="stylesheet" ... href="/assets/index-*.css">
```

### If Still Blank After All Fixes

1. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Deployments → Click deployment
   - Check "Functions" tab for any errors

2. **Enable Vercel Dev Mode Locally**
   ```bash
   npm i -g vercel
   vercel dev
   ```
   - Tests exact Vercel environment locally
   - Visit http://localhost:3000

3. **Test with Minimal Component**
   Temporarily replace App.tsx content:
   ```tsx
   function App() {
     return <div style={{color: 'white', padding: '50px'}}>
       <h1>Jet Suite Test</h1>
       <p>If you see this, React is working!</p>
     </div>;
   }
   export default App;
   ```
   
   If this works → Issue is in a specific component
   If this fails → Issue is with build/deployment setup

4. **Check for Circular Dependencies**
   ```bash
   npx madge --circular --extensions ts,tsx .
   ```

### What the Loading Indicator Shows

- **Loading spinner visible, never disappears**
  → JavaScript failed to load or execute
  → Check Network tab for 404s on JS files

- **Loading spinner disappears, then blank white/dark screen**
  → React mounted but immediately crashed
  → Check Console for errors
  → Error boundary should catch and show error

- **Loading spinner never appears**
  → HTML not loading
  → Check Vercel deployment logs
  → Verify deployment succeeded

### Next Steps

1. Deploy the current changes to Vercel
2. Open browser console and check for error messages
3. Share any error messages you see - that will help me identify the exact issue
4. Check Network tab to see if all assets are loading (200 OK status)

The loading indicator and console logs will help us pinpoint exactly where the issue is occurring.
