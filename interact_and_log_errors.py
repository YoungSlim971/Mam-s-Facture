import asyncio
import playwright
from playwright.async_api import async_playwright, Page, ElementHandle, TimeoutError as PlaywrightTimeoutError
import logging
import os
import re
from urllib.parse import urljoin, urlparse
import time

# --- Configuration ---
APP_BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = "error_screenshots"
LOG_FILE = "interaction_errors.log"
MAX_INTERACTION_TIME_MS = 5000  # Max time to wait for navigation/toast after interaction
TOAST_ERROR_SELECTORS = [
    ".toast-error",  # Generic error toast class
    "[data-sonner-toast][data-type='error']", # sonner specific
    "text=/Le fichier n’a pas pu être téléchargé/i",
    "text=/Une erreur est survenue/i",
    "text=/échec/i", # common for failure
    "text=/erreur/i" # common for error
]
# More specific selectors for toast containers if known, e.g.:
# TOAST_CONTAINER_SELECTOR = "#toast-container"
# If not, page.query_selector_all will search the whole page.

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, mode='w'), # Overwrite log file each run
        logging.StreamHandler()
    ]
)

# --- Global State ---
visited_urls_for_interaction = set()
processed_elements_on_page = set() # To avoid re-interacting with the same element if discovered multiple times on one page load
interaction_errors_found = []

# --- Helper Functions ---
def normalize_url_for_filename(url_str):
    parsed_url = urlparse(url_str)
    path = parsed_url.path.strip('/').replace('/', '_') or 'root'
    query = parsed_url.query.replace('=', '_').replace('&', '_')
    return f"{path}{'_' + query if query else ''}"

async def capture_toast_errors(page: Page, action_description: str, interacted_element_description: str) -> bool:
    """Checks for toast errors and logs them."""
    await page.wait_for_timeout(500) # Short wait for toast to appear

    error_detected_on_action = False
    for i, selector in enumerate(TOAST_ERROR_SELECTORS):
        try:
            # Try to locate the toast using a combination of selectors
            # Wait for a short period for the toast to appear
            if selector.startswith("text="):
                # For text selectors, Playwright handles waiting implicitly with strict mode,
                # but for general selectors, we might need waitForSelector if toasts are slow.
                # Let's try to make it more robust.
                toast_elements = await page.locator(selector).all()
            else:
                toast_elements = await page.query_selector_all(selector)

            for toast_element in toast_elements:
                if await toast_element.is_visible():
                    toast_text = (await toast_element.text_content() or "No text content").strip()
                    logging.error(f"ERROR DETECTED after '{action_description}' on element '{interacted_element_description}' at {page.url}")
                    logging.error(f"  Toast text: {toast_text}")

                    screenshot_filename = f"error_{normalize_url_for_filename(page.url)}_{time.strftime('%Y%m%d_%H%M%S')}_{i}.png"
                    screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_filename)
                    await page.screenshot(path=screenshot_path, full_page=True)
                    logging.info(f"  Screenshot saved to: {screenshot_path}")

                    interaction_errors_found.append({
                        "url": page.url,
                        "action": action_description,
                        "element": interacted_element_description,
                        "error_message": toast_text,
                        "screenshot": screenshot_path
                    })
                    error_detected_on_action = True
                    # Optionally, close the toast if a close button is identifiable to prevent interference
                    # Example: await toast_element.query_selector(".toast-close-button")?.click()
        except PlaywrightTimeoutError:
            logging.debug(f"Timeout waiting for error toast with selector: {selector} on {page.url}")
        except Exception as e:
            logging.warning(f"Exception while checking for toast with selector {selector} on {page.url}: {e}")
    return error_detected_on_action

async def get_element_description(element: ElementHandle) -> str:
    """Creates a string description of an element for logging."""
    tag = await element.evaluate("el => el.tagName.toLowerCase()")
    text = (await element.text_content() or "").strip().replace("\n", " ")[:50] # Limit text length
    attrs_to_get = ["id", "name", "type", "placeholder", "href", "data-testid", "aria-label", "role"]
    desc_parts = [f"tag={tag}"]
    if text:
        desc_parts.append(f"text='{text}'")
    for attr in attrs_to_get:
        val = await element.get_attribute(attr)
        if val:
            desc_parts.append(f"{attr}='{val}'")
    return ", ".join(desc_parts)


async def interact_with_element(page: Page, element: ElementHandle):
    element_desc = await get_element_description(element)
    if element_desc in processed_elements_on_page:
        logging.debug(f"Skipping already processed element: {element_desc}")
        return
    processed_elements_on_page.add(element_desc)

    tag_name = (await element.evaluate("el => el.tagName.toLowerCase()"))
    is_visible = await element.is_visible()
    is_enabled = await element.is_enabled()

    if not is_visible:
        logging.info(f"Skipping non-visible element: {element_desc}")
        return

    current_url_before_action = page.url

    action_taken_description = ""

    try:
        if not is_enabled:
            logging.info(f"Skipping disabled element: {element_desc}")
            # Consider if testing disabled elements is a requirement (e.g., for accessibility)
            return

        logging.info(f"Attempting to interact with: {element_desc} on {page.url}")

        if tag_name in ["button", "a"] or await element.get_attribute("role") in ["button", "link", "menuitem", "tab"]:
            action_taken_description = f"click {tag_name}"
            # await element.click(timeout=MAX_INTERACTION_TIME_MS / 2) # Shorter timeout for click itself
            # Use page.expect_navigation or page.expect_popup for actions that open new tabs/windows
            current_element_text_content = await element.text_content()
            element_text_lower = (current_element_text_content or "").lower()
            if "changer le thème" in element_text_lower or "theme toggle" in element_text_lower:
                logging.info(f"Performing SPA-like click for theme button: {element_desc}")
                await element.click(timeout=2000)
                await page.wait_for_timeout(1000) # Wait for theme change to apply and potential toasts
            else:
                # For other buttons/links, assume navigation is possible
                logging.info(f"Performing potentially navigating click for: {element_desc}")
                try:
                    async with page.expect_navigation(wait_until="networkidle", timeout=MAX_INTERACTION_TIME_MS):
                        await element.click(timeout=2000)
                except PlaywrightTimeoutError:
                    logging.warning(f"No navigation occurred after clicking {element_desc}, or timeout waiting for 'networkidle'. Continuing on same page.")
                    # If it times out, it means no full navigation happened as expected by expect_navigation.
                    # The page might have updated via JS. We still want to check for toasts.
                    await page.wait_for_timeout(500) # Wait for potential JS changes or toasts
                except Exception as e:
                    # Handle other click errors if page.expect_navigation itself fails before click
                    if "Target page, context or browser has been closed" in str(e):
                         logging.error(f"Browser/Context/Page closed during click on {element_desc}. URL: {current_url_before_action}. Error: {e}")
                         raise # Re-raise to stop further processing on this page
                    else:
                        logging.error(f"Error during click (with expect_navigation) on {element_desc}: {e}")
                        # We might still be on the same page, or an error page. Try to capture toast.
                        await page.wait_for_timeout(500)

        elif tag_name == "input":
            input_type = await element.get_attribute("type") or "text"
            action_taken_description = f"fill input type='{input_type}'"
            if input_type in ["text", "email", "password", "search", "tel", "url", "number"]:
                sample_value = "test"
                if input_type == "email": sample_value = "test@example.com"
                if input_type == "number": sample_value = "123"
                await element.fill(sample_value, timeout=1000)
            elif input_type == "date":
                await element.fill("2024-01-01", timeout=1000) # YYYY-MM-DD format
            elif input_type == "checkbox" or input_type == "radio":
                action_taken_description = f"check input type='{input_type}'"
                await element.check(timeout=1000)
            # Add other input types like 'file' if needed (more complex)
            else:
                logging.info(f"Skipping interaction for input type: {input_type}")
                action_taken_description = "" # No action taken
            if action_taken_description: await page.wait_for_timeout(200)


        elif tag_name == "select":
            action_taken_description = "select option"
            # Try to select the first non-disabled option
            options = await element.query_selector_all("option:not([disabled])")
            if options:
                value_to_select = await options[0].get_attribute("value")
                if value_to_select:
                    await element.select_option(value=value_to_select, timeout=1000)
                else: # if option has no value, try by label/text
                    label_to_select = await options[0].text_content()
                    if label_to_select:
                         await element.select_option(label=label_to_select, timeout=1000)
            else:
                logging.info(f"No selectable options found for: {element_desc}")
                action_taken_description = ""
            if action_taken_description: await page.wait_for_timeout(200)


        elif tag_name == "textarea":
            action_taken_description = "fill textarea"
            await element.fill("This is a test text for the textarea.", timeout=1000)
            await page.wait_for_timeout(200)

        else:
            logging.info(f"No specific interaction defined for tag: {tag_name}. Skipping generic interaction for now.")
            return # Don't check for errors if no action taken

        if action_taken_description: # Only check for errors if an action was attempted
            await capture_toast_errors(page, action_taken_description, element_desc)
            # If navigation happened, the new URL will be different.
            if page.url != current_url_before_action:
                logging.info(f"Navigation occurred: {current_url_before_action} -> {page.url}")
                # Add the new URL to the crawl queue if it's not visited and within scope
                # This part is handled by the main crawl_site logic
                return # Stop further interactions on the old page's context

    except PlaywrightTimeoutError as pte:
        logging.warning(f"Timeout during interaction with {element_desc} on {page.url}: {pte}")
        interaction_errors_found.append({
            "url": page.url, "action": action_taken_description or f"interact with {tag_name}", "element": element_desc,
            "error_message": f"PlaywrightTimeoutError: {str(pte)}", "screenshot": "N/A (Timeout)"
        })
    except playwright._impl._errors.Error as ple: # More specific playwright errors
        # Element detached, not visible, etc.
        logging.error(f"Playwright error interacting with {element_desc} on {page.url}: {ple}")
        screenshot_filename = f"playwright_error_{normalize_url_for_filename(page.url)}_{time.strftime('%Y%m%d_%H%M%S')}.png"
        screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_filename)
        try:
            await page.screenshot(path=screenshot_path, full_page=True)
            logging.info(f"  Screenshot saved to: {screenshot_path}")
        except Exception as se:
            screenshot_path = f"N/A (Screenshot failed: {se})"
            logging.error(f"Failed to take screenshot for Playwright error: {se}")

        interaction_errors_found.append({
            "url": page.url, "action": action_taken_description or f"interact with {tag_name}", "element": element_desc,
            "error_message": f"PlaywrightError: {str(ple)}", "screenshot": screenshot_path
        })
    except Exception as e:
        logging.error(f"Generic error interacting with {element_desc} on {page.url}: {e}")
        screenshot_filename = f"generic_error_{normalize_url_for_filename(page.url)}_{time.strftime('%Y%m%d_%H%M%S')}.png"
        screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_filename)
        try:
            await page.screenshot(path=screenshot_path, full_page=True)
            logging.info(f"  Screenshot saved to: {screenshot_path}")
        except Exception as se:
            screenshot_path = f"N/A (Screenshot failed: {se})"
            logging.error(f"Failed to take screenshot for generic error: {se}")

        interaction_errors_found.append({
            "url": page.url, "action": action_taken_description or f"interact with {tag_name}", "element": element_desc,
            "error_message": f"GenericError: {str(e)}", "screenshot": screenshot_path
        })


async def crawl_and_interact(page: Page, url_to_crawl: str):
    # Normalize URL for visited check (optional: remove query/fragment if they don't define unique pages)
    normalized_url_for_visited_check = url_to_crawl.split('#')[0] # .split('?')[0] # Keep query for now

    if normalized_url_for_visited_check in visited_urls_for_interaction:
        logging.info(f"Skipping already visited URL for interaction: {url_to_crawl}")
        return

    if not url_to_crawl.startswith(APP_BASE_URL):
        logging.info(f"Skipping out-of-scope URL: {url_to_crawl}")
        return

    visited_urls_for_interaction.add(normalized_url_for_visited_check)
    processed_elements_on_page.clear() # Reset for the new page
    logging.info(f"Navigating to and interacting on: {url_to_crawl}")

    try:
        await page.goto(url_to_crawl, wait_until="networkidle", timeout=10000)
        await page.wait_for_timeout(1000) # Extra wait for dynamic content
    except PlaywrightTimeoutError:
        logging.error(f"Timeout navigating to {url_to_crawl}")
        interaction_errors_found.append({
            "url": url_to_crawl, "action": "page_navigation", "element": "N/A",
            "error_message": f"Timeout navigating to URL", "screenshot": "N/A"
        })
        return
    except Exception as e:
        logging.error(f"Error navigating to {url_to_crawl}: {e}")
        interaction_errors_found.append({
            "url": url_to_crawl, "action": "page_navigation", "element": "N/A",
            "error_message": f"Navigation error: {str(e)}", "screenshot": "N/A"
        })
        return

    # Selectors for interactive elements
    # Prioritize common interactive elements, then more generic ones
    # This list can be expanded based on application structure (e.g. custom component selectors)
    selectors_to_try = [
        "button",
        "a[href]", # Links with href
        "input:not([type='hidden'])", # All visible inputs
        "select",
        "textarea",
        "[role='button']",
        "[role='link']",
        "[role='menuitem']",
        "[role='tab']",
        "[role='checkbox']",
        "[role='radio']",
        "[onclick]", # Elements with onclick handlers
        # Add data-testid patterns if common
        "[data-testid*='button']",
        "[data-testid*='link']",
        "[data-testid*='submit']",
        "[data-testid*='action']",
        "[data-testid*='menu-item']",
    ]

    discovered_elements_on_this_page = []
    for selector in selectors_to_try:
        elements = await page.query_selector_all(selector)
        for el in elements:
            if await el.is_visible() and await el.is_enabled(): # Only consider visible and enabled elements
                 # Simple way to avoid adding essentially the same element multiple times if caught by different selectors
                is_unique = True
                for _, existing_el_handle in discovered_elements_on_this_page:
                    if await el.evaluate_handle("(el1, el2) => el1 === el2", existing_el_handle):
                        is_unique = False
                        break
                if is_unique:
                    discovered_elements_on_this_page.append((await get_element_description(el), el))


    # Sort elements to have a somewhat consistent interaction order (optional)
    # Example: by tag name, then by text or an attribute
    # discovered_elements_on_this_page.sort(key=lambda x: (x[0].split(',')[0], x[0]))


    for el_desc, element_handle in discovered_elements_on_this_page:
        if page.url == url_to_crawl: # Ensure we are still on the same page (no unexpected navigation from previous interaction)
            await interact_with_element(page, element_handle)
        else:
            logging.warning(f"URL changed unexpectedly from {url_to_crawl} to {page.url} before interacting with {el_desc}. Breaking interaction loop for this page.")
            break # Stop interacting on this page as its state is uncertain

    # After interacting with all elements on the current page, find new links to crawl
    if page.url.startswith(APP_BASE_URL): # Only crawl further if we are still in the app
        new_links_to_crawl = []
        link_elements = await page.query_selector_all("a[href]")
        for link_el in link_elements:
            if await link_el.is_visible():
                href = await link_el.get_attribute("href")
                if href:
                    abs_url = urljoin(page.url, href)
                    # Normalize for visited check (remove fragment, optionally query)
                    normalized_abs_url_for_visited = abs_url.split('#')[0] # .split('?')[0]
                    if abs_url.startswith(APP_BASE_URL) and normalized_abs_url_for_visited not in visited_urls_for_interaction:
                        new_links_to_crawl.append(abs_url)

        for new_link in set(new_links_to_crawl): # Use set to avoid duplicate crawls initiated from same page
            await crawl_and_interact(page, new_link)


async def main():
    if not os.path.exists(SCREENSHOT_DIR):
        os.makedirs(SCREENSHOT_DIR)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 JulesTestBot/1.0"
        )
        # Handle dialogs automatically (e.g., alert, confirm, prompt) by dismissing them
        # This prevents the script from hanging on unexpected popups.
        def handle_dialog(dialog):
            logging.info(f"Dialog opened: type={dialog.type}, message='{dialog.message}'. Dismissing.")
            # It's better to await dismiss directly if possible, or ensure the task is handled.
            # For simplicity here, we'll make the handler async and await.
            async def dismiss_dialog_async():
                try:
                    await dialog.dismiss()
                    logging.info(f"Dialog '{dialog.message}' dismissed.")
                except Exception as e:
                    logging.error(f"Error dismissing dialog '{dialog.message}': {e}")
            asyncio.create_task(dismiss_dialog_async())
        context.on("dialog", handle_dialog)

        page = await context.new_page()

        try:
            await crawl_and_interact(page, APP_BASE_URL + "/")
        except Exception as e:
            logging.critical(f"Critical error during crawl_and_interact: {e}", exc_info=True)
        finally:
            await browser.close()

    logging.info(f"--- Interaction Test Summary ---")
    if interaction_errors_found:
        logging.info(f"Found {len(interaction_errors_found)} errors/potential issues:")
        for error_item in interaction_errors_found:
            logging.info(f"  URL: {error_item['url']}")
            logging.info(f"  Action: {error_item['action']}")
            logging.info(f"  Element: {error_item['element']}")
            logging.info(f"  Message: {error_item['error_message']}")
            logging.info(f"  Screenshot: {error_item['screenshot']}")
            logging.info(f"  ----")
    else:
        logging.info("No interaction errors detected based on specified criteria.")

if __name__ == "__main__":
    asyncio.run(main())
