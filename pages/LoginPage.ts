import { Locator, Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}
  private newPage: Page | null = null;

  username: Locator = this.page.locator("#floatingLabelInput34");
  password: Locator = this.page.locator("#floatingLabelInput39");
  loginButton: Locator = this.page.locator("//button[@type= 'submit']");
  loginLink: Locator = this.page.locator("//a[@class= 'form-submit']");

  // Use a method to safely access the locator from newPage
  async getNewPageLocator(selector: string): Promise<Locator | null> {
    if (this.newPage) {
      return await this.newPage.locator(selector);
    }
    // Wait for the new page to exist
    this.newPage = await this.page.waitForEvent("popup"); // Ensure newPage is assigned
    return this.newPage ? this.newPage.locator(selector) : null; // Ensure newPage is of type Page
  }
  // Store the new page context

  async navigateToLogin() {
    await this.page.goto("https://www.tvh.com/");

    // Capture the new page context
    [this.newPage] = await Promise.all([
      this.page.waitForEvent("popup"), // Wait for the new page to open
      this.loginLink.click(), // Click the login link
    ]);
  }

  // Method to get the new page context
  async login(user: string, password: string) {
    const usernameLocator =
      (await this.getNewPageLocator("#floatingLabelInput34")) || this.username;
    const passwordLocator =
      (await this.getNewPageLocator("#floatingLabelInput39")) || this.password;
    const loginButtonLocator =
      (await this.getNewPageLocator("//button[@type= 'submit']")) ||
      this.loginButton;

    await usernameLocator.fill(user);
    await passwordLocator.fill(password);
    await loginButtonLocator.click();
    await this.page.waitForTimeout(5000); // Wait for 5 seconds to ensure the login process completes
    // Close the new page if it exists
    if (this.newPage) {
      await this.newPage.close();
    }
  }
}
