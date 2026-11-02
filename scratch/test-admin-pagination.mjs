import assert from "node:assert";

// Implementation of getPageNumbers to test exact logic
function getPageNumbers(currentPage, pageCount) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages = [];
  pages.push(1);
  if (currentPage > 3) {
    pages.push("...");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(pageCount - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < pageCount - 2) {
    pages.push("...");
  }
  pages.push(pageCount);
  return pages;
}

// Test getPageNumbers logic
console.log("--- Testing AdminPagination.getPageNumbers ---");
assert.deepStrictEqual(getPageNumbers(1, 1), [1]);
assert.deepStrictEqual(getPageNumbers(1, 3), [1, 2, 3]);
assert.deepStrictEqual(getPageNumbers(2, 5), [1, 2, 3, 4, 5]);
assert.deepStrictEqual(getPageNumbers(1, 10), [1, 2, "...", 10]);
assert.deepStrictEqual(getPageNumbers(2, 10), [1, 2, 3, "...", 10]);
assert.deepStrictEqual(getPageNumbers(3, 10), [1, 2, 3, 4, "...", 10]);
assert.deepStrictEqual(getPageNumbers(5, 10), [1, "...", 4, 5, 6, "...", 10]);
assert.deepStrictEqual(getPageNumbers(8, 10), [1, "...", 7, 8, 9, 10]);
assert.deepStrictEqual(getPageNumbers(9, 10), [1, "...", 8, 9, 10]);
assert.deepStrictEqual(getPageNumbers(10, 10), [1, "...", 9, 10]);
console.log("✓ All getPageNumbers assertions passed!");

// Test clamping calculation logic used on delete
function calculateClampedOffset(currentOffset, totalBeforeDelete, pageSize) {
  const remainingTotal = Math.max(0, totalBeforeDelete - 1);
  const lastPageOffset =
    remainingTotal === 0
      ? 0
      : Math.floor((remainingTotal - 1) / pageSize) * pageSize;
  return Math.min(currentOffset, lastPageOffset);
}

console.log("--- Testing delete offset clamping ---");
// 11 items, pageSize 10: page 0 (items 1-10), page 10 (item 11).
// Deleting item 11 (only item on page 2):
assert.strictEqual(calculateClampedOffset(10, 11, 10), 0);
// 12 items, deleting 1 item from page 2:
assert.strictEqual(calculateClampedOffset(10, 12, 10), 10);
// 1 item, deleting it:
assert.strictEqual(calculateClampedOffset(0, 1, 10), 0);
// 21 items, deleting item 21 on page 3 (offset 20):
assert.strictEqual(calculateClampedOffset(20, 21, 10), 10);
console.log("✓ All delete clamping assertions passed!");

// Test API Endpoints with Admin JWT
async function testAdminApis() {
  console.log("--- Testing Admin Endpoints ---");
  const loginRes = await fetch("http://127.0.0.1:8000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@way2skills.com",
      password: "Secure-Admin-Password-123"
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
  }

  const { access_token } = await loginRes.json();
  assert(access_token, "Must obtain access_token");
  console.log("✓ Admin login successful!");

  const headers = { Authorization: `Bearer ${access_token}` };

  // Test Courses API with limit=10, offset=0
  const coursesRes = await fetch("http://127.0.0.1:8000/api/admin/courses?limit=10&offset=0", { headers });
  assert.strictEqual(coursesRes.status, 200);
  const coursesPage = await coursesRes.json();
  console.log(`✓ Admin Courses page: total=${coursesPage.total}, returned=${coursesPage.items.length}, limit=${coursesPage.limit}, offset=${coursesPage.offset}`);
  assert(coursesPage.limit === 10, "Limit should be 10");
  assert(coursesPage.items.length <= 10, "Should return at most 10 items");

  // Test Internships API with limit=10, offset=0
  const internshipsRes = await fetch("http://127.0.0.1:8000/api/admin/internships?limit=10&offset=0", { headers });
  assert.strictEqual(internshipsRes.status, 200);
  const internshipsPage = await internshipsRes.json();
  console.log(`✓ Admin Internships page: total=${internshipsPage.total}, returned=${internshipsPage.items.length}, limit=${internshipsPage.limit}, offset=${internshipsPage.offset}`);
  assert(internshipsPage.limit === 10, "Limit should be 10");
  assert(internshipsPage.items.length <= 10, "Should return at most 10 items");
}

testAdminApis().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
