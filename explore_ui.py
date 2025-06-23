import asyncio
from playwright.async_api import async_playwright
import logging
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Global set to store all unique interactive element descriptors
all_interactive_elements = set()
# Global set to store visited URLs to prevent re-processing and loops
visited_urls = set()

async def find_interactive_elements(page, url):
    logging.info(f"Scanning page: {url}")
    page_elements = []

    # Buttons
    buttons = await page.query_selector_all("button")
    for button in buttons:
        if await button.is_visible():
            text = await button.text_content()
            element_id = await button.get_attribute("id")
            data_testid = await button.get_attribute("data-testid")
            class_name = await button.get_attribute("class")
            element_repr = f"Button: text='{text.strip() if text else 'No text'}'"
            if element_id: element_repr += f", id='{element_id}'"
            if data_testid: element_repr += f", data-testid='{data_testid}'"
            if class_name: element_repr += f", class='{class_name}'"
            page_elements.append(element_repr)

    # Links
    links = await page.query_selector_all("a")
    for link in links:
        if await link.is_visible():
            text = await link.text_content()
            href = await link.get_attribute("href")
            element_id = await link.get_attribute("id")
            data_testid = await link.get_attribute("data-testid")
            class_name = await link.get_attribute("class")
            element_repr = f"Link: text='{text.strip() if text else 'No text'}' (href: {href or 'No href'})"
            if element_id: element_repr += f", id='{element_id}'"
            if data_testid: element_repr += f", data-testid='{data_testid}'"
            if class_name: element_repr += f", class='{class_name}'"
            page_elements.append(element_repr)

    # Inputs
    inputs = await page.query_selector_all("input")
    for input_el in inputs:
        if await input_el.is_visible():
            input_type = await input_el.get_attribute("type")
            name = await input_el.get_attribute("name")
            element_id = await input_el.get_attribute("id")
            placeholder = await input_el.get_attribute("placeholder")
            data_testid = await input_el.get_attribute("data-testid")
            class_name = await input_el.get_attribute("class")
            label_text = ""
            if element_id:
                label_el = await page.query_selector(f"label[for='{element_id}']")
                if label_el and await label_el.is_visible():
                    label_text = (await label_el.text_content() or "").strip()

            element_repr = f"Input: type='{input_type or 'text'}'"
            if name: element_repr += f", name='{name}'"
            if element_id: element_repr += f", id='{element_id}'"
            if placeholder: element_repr += f", placeholder='{placeholder}'"
            if data_testid: element_repr += f", data-testid='{data_testid}'"
            if label_text: element_repr += f", label='{label_text}'"
            if class_name: element_repr += f", class='{class_name}'"
            page_elements.append(element_repr)

    # Selects
    selects = await page.query_selector_all("select")
    for select in selects:
        if await select.is_visible():
            name = await select.get_attribute("name")
            element_id = await select.get_attribute("id")
            data_testid = await select.get_attribute("data-testid")
            class_name = await select.get_attribute("class")
            label_text = ""
            if element_id:
                label_el = await page.query_selector(f"label[for='{element_id}']")
                if label_el and await label_el.is_visible():
                    label_text = (await label_el.text_content() or "").strip()
            element_repr = f"Select: name='{name or 'No name'}'"
            if element_id: element_repr += f", id='{element_id}'"
            if data_testid: element_repr += f", data-testid='{data_testid}'"
            if label_text: element_repr += f", label='{label_text}'"
            if class_name: element_repr += f", class='{class_name}'"
            page_elements.append(element_repr)

    # Textareas
    textareas = await page.query_selector_all("textarea")
    for textarea in textareas:
        if await textarea.is_visible():
            name = await textarea.get_attribute("name")
            element_id = await textarea.get_attribute("id")
            placeholder = await textarea.get_attribute("placeholder")
            data_testid = await textarea.get_attribute("data-testid")
            class_name = await textarea.get_attribute("class")
            label_text = ""
            if element_id:
                label_el = await page.query_selector(f"label[for='{element_id}']")
                if label_el and await label_el.is_visible():
                    label_text = (await label_el.text_content() or "").strip()
            element_repr = f"Textarea: name='{name or 'No name'}'"
            if element_id: element_repr += f", id='{element_id}'"
            if placeholder: element_repr += f", placeholder='{placeholder}'"
            if data_testid: element_repr += f", data-testid='{data_testid}'"
            if label_text: element_repr += f", label='{label_text}'"
            if class_name: element_repr += f", class='{class_name}'"
            page_elements.append(element_repr)

    # Generic clickable elements (e.g. divs with role=button or common testids)
    # This might catch some elements already caught, but also new ones.
    clickables_selectors = "[role='button'], [role='menuitem'], [role='tab'], [onclick], [data-testid*='button'], [data-testid*='link'], [data-testid*='item'], [data-testid*='tab']"
    # Add specific classes if known to be interactive
    # clickables_selectors += ", .interactive-class-example"

    clickables = await page.query_selector_all(clickables_selectors)
    for clickable in clickables:
        if await clickable.is_visible():
            tag_name = await clickable.evaluate("element => element.tagName.toLowerCase()")
            text_content = (await clickable.text_content() or "").strip()
            element_id = await clickable.get_attribute("id")
            data_testid = await clickable.get_attribute("data-testid")
            class_name = await clickable.get_attribute("class")

            # Avoid duplicates from more specific selectors if possible by checking tag type
            is_standard_interactive_tag = tag_name in ["button", "a", "input", "select", "textarea"]

            if not is_standard_interactive_tag or not any(tag_name.capitalize() in el_repr for el_repr in page_elements):
                element_repr = f"Clickable ({tag_name}): text='{text_content}'"
                if element_id: element_repr += f", id='{element_id}'"
                if data_testid: element_repr += f", data-testid='{data_testid}'"
                # Add role if it exists and is not button (already in selector)
                role = await clickable.get_attribute("role")
                if role and role != 'button': element_repr += f", role='{role}'"
                if class_name: element_repr += f", class='{class_name}'"
                page_elements.append(element_repr)

    for el_repr in page_elements:
        all_interactive_elements.add(el_repr)

    # Find new navigable links for further exploration
    nav_links = []
    all_links_on_page = await page.query_selector_all("a[href]")
    for link_el in all_links_on_page:
        if await link_el.is_visible():
            href = await link_el.get_attribute("href")
            if href:
                # Normalize URL to be absolute
                abs_url = urljoin(page.url, href)
                # Stay within the same domain/app
                if abs_url.startswith("http://localhost:5173"):
                    nav_links.append(abs_url)
    return nav_links


async def crawl_site(page, start_url):
    if start_url in visited_urls:
        return

    visited_urls.add(start_url)
    logging.info(f"Navigating to: {start_url}")

    try:
        await page.goto(start_url, wait_until="networkidle", timeout=10000) # Wait for network to be idle
        await page.wait_for_timeout(1000) # Additional wait for dynamic content
    except Exception as e:
        logging.error(f"Error navigating to {start_url}: {e}")
        return

    # Wait for any known dynamic content loaders if applicable. Example:
    # try:
    #     await page.wait_for_selector(".loading-spinner", state="hidden", timeout=5000)
    # except:
    #     logging.warning(f"Loading spinner did not disappear on {start_url}")

    navigable_links = await find_interactive_elements(page, start_url)

    for link_url in navigable_links:
        # Remove fragment and query parameters for visited check to avoid re-crawling slight variations of same base page
        # if the app uses them for non-essential state. Be careful if query params define unique content.
        base_link_url = link_url.split('#')[0].split('?')[0]
        if base_link_url not in visited_urls:
            await crawl_site(page, link_url) # Pass original link_url for navigation

async def main():
    start_url = "http://localhost:5173/"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True) # Ensure headless is explicitly set if needed
        page = await browser.new_page()

        await crawl_site(page, start_url)

        await browser.close()

    logging.info(f"Finished crawling. Found {len(all_interactive_elements)} unique interactive elements.")
    for element_repr in sorted(list(all_interactive_elements)): # Sort for consistent output
        print(element_repr)

if __name__ == "__main__":
    asyncio.run(main())
