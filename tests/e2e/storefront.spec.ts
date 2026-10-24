import { expect, test } from "@playwright/test";

test.describe("storefront main journey", () => {
  test("search, add to cart (persists after reload), COD checkout, admin sees order", async ({
    page,
  }) => {
    // 1. Open the storefront and wait for hydration.
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Authentic Bangladeshi|খাঁটি বাংলাদেশি/ })).toBeVisible();

    // 2. Switch language to Bengali and back to English.
    await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).click();
    await page.getByRole("banner").getByRole("button", { name: "EN" }).click();

    // 3. Search for a product.
    await page.getByPlaceholder(/Search products/i).fill("kantha");
    await page.getByPlaceholder(/Search products/i).press("Enter");
    await expect(page).toHaveURL(/\/search\?q=kantha/);

    // 4. Open a product details page.
    await page.getByRole("link", { name: /Nakshi Kantha Bed Cover/i }).first().click();
    await expect(page).toHaveURL(/\/products\/nakshi-kantha-bed-cover/);

    // 5. Select a size (variant) and add to cart.
    await page.getByRole("button", { name: "King" }).click();
    await page.getByRole("button", { name: /Add to Cart/i }).first().click();

    // 6. Refresh and confirm the cart persists.
    await page.reload();
    const cartBadge = page.locator("header").getByText("1", { exact: true }).first();
    await expect(cartBadge).toBeVisible();

    // 7. Complete checkout with COD.
    await page.goto("/checkout");
    await page.getByLabel(/Full Name/i).fill("Playwright User");
    await page.getByLabel(/Phone Number/i).fill("01712345678");
    await page.getByLabel(/District/i).selectOption("Dhaka");
    await page.getByLabel(/City/i).fill("Dhanmondi");
    await page.getByLabel(/Full Address/i).fill("House 1, Road 2");
    await page.getByRole("button", { name: "→" }).click(); // info -> delivery
    await page.getByRole("button", { name: "→" }).click(); // delivery -> payment
    await page.getByRole("button", { name: "→" }).click(); // payment -> review
    await page.getByRole("button", { name: /Place Order/i }).click();

    // 8. Order confirmation.
    await expect(page.getByText(/Order Number/i)).toBeVisible();

    // 9. Open admin and verify the order is listed.
    await page.goto("/admin/orders");
    await expect(page.getByText(/Playwright User/i).first()).toBeVisible();
  });
});
