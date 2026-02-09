# Testing Disputes - Debugging Steps

## 1. Run Database Migration

```bash
cd /home/jjhbk/humantouch
pnpm db:migrate
```

Look for:
- ✅ Migration creates `Dispute` table
- ✅ Migration creates `DisputeComment` table

## 2. Restart Services

```bash
# Terminal 1 - Backend
pnpm --filter @humanlayer/backend run dev

# Terminal 2 - Frontend
pnpm --filter @humanlayer/frontend run dev
```

## 3. Test Dispute Creation

### A. Open Browser Console (F12)

### B. Navigate to an Order
- Go to `/orders/[some-order-id]` (buyer view)
- Or `/provider/orders/[some-order-id]` (provider view)
- Make sure order status is NOT PENDING, COMPLETED, CANCELLED, or REFUNDED

### C. Check Console Logs
Look for:
```
Dispute fetched: null or Object
No dispute found or error: 404
```

### D. Click "Open Dispute" Button
- Should be a red outline button
- Opens modal dialog

### E. Fill Form
- Select reason (e.g., "Quality Issues")
- Enter description (minimum 10 characters)
- Click "Submit Dispute"

### F. Watch Console for:
```
Dispute created: { id: "...", orderId: "...", ... }
Dispute created, refreshing data...
Order refreshed, fetching dispute...
Dispute data: { id: "...", ... }
```

### G. Check Network Tab
- Filter by "disputes"
- Should see:
  1. POST /api/v1/disputes (Status: 201)
  2. GET /api/v1/disputes/order/[orderId] (Status: 200)

## 4. Verify in Database

```bash
pnpm db:studio
```

Check:
- `Dispute` table has new entry
- `orderId` matches your order
- `status` is "OPEN"

## 5. Test Dispute Display

### Expected UI:
1. **Dispute Details Card** (red border)
   - Shows status badge
   - Shows reason and description

2. **Dispute Chat Card**
   - Title: "Dispute Discussion"
   - Empty message list
   - Text input and Send button

### If Not Showing:
Check console for error messages.

## 6. Test Dispute Chat

### A. Send Message
- Type message in text area
- Click "Send" or press Enter
- Watch console:
```
Comment added (success toast)
```

### B. Check Network
- POST /api/v1/disputes/[disputeId]/comments (Status: 201)
- GET /api/v1/disputes/[disputeId]/comments (Status: 200)

### C. Verify Message Appears
- Your message should show in blue bubble on right
- Should have your name and timestamp

## 7. Test Admin View

### A. Set User as Admin
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

### B. Navigate to Admin Panel
- Header should show "Admin: Disputes" link (red)
- Go to `/admin/disputes`

### C. Check Disputes List
- Should see dispute in list
- Status: OPEN (red border)
- Click "Resolve" button

### D. Add Admin Comment
- In dispute chat, type message
- Send it
- Should appear in YELLOW bubble marked "(Admin)"

### E. Resolve Dispute
- Scroll to "Resolve Dispute" section
- Select new order status
- Enter resolution description
- Click "Resolve Dispute"

## Common Issues & Fixes

### Issue: "Dispute created but UI refresh failed"

**Fix:**
Check backend logs for errors when fetching dispute. Might be:
- Dispute endpoint returning wrong format
- Missing includes in Prisma query

### Issue: Dispute doesn't show after creation

**Fix:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check if order status changed to DISPUTED:
   ```sql
   SELECT id, orderNumber, status FROM "Order" WHERE id = 'your-order-id';
   ```
3. Verify dispute exists:
   ```sql
   SELECT * FROM "Dispute" WHERE orderId = 'your-order-id';
   ```

### Issue: DisputeChat shows "Loading comments..."

**Fix:**
- Check browser console for 403/404 errors
- Verify `/api/v1/disputes/[id]/comments` endpoint exists
- Check backend logs

### Issue: Admin can't see disputes

**Fix:**
1. Verify admin role in database
2. Logout and login again
3. Check browser localStorage for updated JWT token

### Issue: Comments not showing

**Fix:**
1. Check DisputeComment table exists:
   ```sql
   SELECT * FROM "DisputeComment" LIMIT 1;
   ```
2. Verify comment was created:
   ```sql
   SELECT * FROM "DisputeComment" WHERE disputeId = 'your-dispute-id';
   ```
3. Check backend endpoint returns data

## Manual API Testing

Use curl or Postman to test endpoints directly:

### Create Dispute
```bash
curl -X POST http://localhost:3001/api/v1/disputes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "YOUR_ORDER_ID",
    "reason": "quality",
    "description": "The work does not meet the requirements."
  }'
```

### Get Dispute for Order
```bash
curl http://localhost:3001/api/v1/disputes/order/YOUR_ORDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Comment
```bash
curl -X POST http://localhost:3001/api/v1/disputes/YOUR_DISPUTE_ID/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "This is a test comment"
  }'
```

### Get Comments
```bash
curl http://localhost:3001/api/v1/disputes/YOUR_DISPUTE_ID/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Success Checklist

- [ ] Migration ran successfully
- [ ] Backend compiles without errors
- [ ] Frontend loads without console errors
- [ ] Can see "Open Dispute" button on order page
- [ ] Dispute form opens and submits
- [ ] Console shows "Dispute created" log
- [ ] Dispute Details card appears after creation
- [ ] Dispute Chat card appears
- [ ] Can send messages in dispute chat
- [ ] Messages appear in chat UI
- [ ] Admin can access /admin/disputes
- [ ] Admin can see dispute in list
- [ ] Admin comments appear in yellow
- [ ] Admin can resolve dispute
- [ ] Resolution updates order status
